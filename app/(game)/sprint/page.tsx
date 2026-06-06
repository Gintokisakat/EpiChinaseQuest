'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { processSrsAnswer, processRevenge, type SrsBox } from '@/lib/game/srs'
import AudioButton from '@/components/ui/audio-button'
import { useToast } from '@/components/ui/toast'
import LiliAvatar from '@/components/ui/lili-avatar'
import type { Card, UserCard } from '@/types'

type Phase = 'select' | 'playing' | 'done'
const TIMER_OPTIONS = [30, 60, 120] as const

export default function SprintPage() {
  const [phase, setPhase] = useState<Phase>('select')
  const [timerSecs, setTimerSecs] = useState(60)
  const [timeLeft, setTimeLeft] = useState(60)
  const [cards, setCards] = useState<(Card & { userCard?: UserCard })[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [correctAnswer, setCorrectAnswer] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [score, setScore] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [totalAnswered, setTotalAnswered] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [currentStreak, setCurrentStreak] = useState(0)
  const [loading, setLoading] = useState(false)
  const [xpEarned, setXpEarned] = useState(0)
  const [options, setOptions] = useState<string[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const loadCards = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('user_cards')
      .select('*, card:card_id(*)')
      .eq('user_id', user.id)
      .or('revise1.eq.true,revise2.eq.true,known.eq.true')
      .order('revenge_marked', { ascending: false })
      .limit(100)

    if (data) {
      const mapped = (data as (UserCard & { card: Card })[]).map(uc => ({
        ...uc.card,
        userCard: { ...uc } as UserCard,
      }))
      setCards(mapped as (Card & { userCard?: UserCard })[])
    }
    setLoading(false)
  }, [supabase])

  const startGame = useCallback(async (secs: number) => {
    setTimerSecs(secs)
    setTimeLeft(secs)
    setScore(0)
    setCorrectCount(0)
    setTotalAnswered(0)
    setBestStreak(0)
    setCurrentStreak(0)
    setSelected(null)
    setIsCorrect(null)
    setXpEarned(0)
    setCurrentIndex(0)
    setPhase('playing')

    await loadCards()

    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          setPhase('done')
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [loadCards])

  const handleAnswer = useCallback(async (answer: string) => {
    if (selected || phase !== 'playing') return
    setSelected(answer)

    const card = cards[currentIndex]
    if (!card) return

    const correct = answer === card.pinyin
    setIsCorrect(correct)
    setTotalAnswered(prev => prev + 1)

    if (correct) {
      setScore(prev => prev + 10)
      setCorrectCount(prev => prev + 1)
      setCurrentStreak(prev => {
        const s = prev + 1
        setBestStreak(best => Math.max(best, s))
        return s
      })
    } else {
      setCurrentStreak(0)
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (card.userCard) {
      const currentBox: SrsBox = card.userCard.known ? 'known'
        : card.userCard.revise1 ? 'revise1'
        : 'revise2'
      const srs = processSrsAnswer(currentBox, correct)
      const revenge = processRevenge(
        correct,
        card.userCard.challenge_streak,
        card.userCard.challenge_best,
        card.userCard.revenge_marked,
      )
      const newLevel = card.userCard.card_level + (correct ? 1 : 0)

      await supabase.from('user_cards').upsert({
        id: card.userCard.id,
        user_id: user.id,
        card_id: card.id,
        known: srs.newBox === 'known',
        revise1: srs.newBox === 'revise1' || (srs.newBox === 'revise2' && currentBox === 'known'),
        revise2: srs.newBox === 'revise2',
        card_level: newLevel,
        challenge_streak: revenge.newStreak,
        challenge_best: revenge.newBest,
        revenge_marked: revenge.revengeMarked,
        dk_added_at: correct && !card.userCard.known ? new Date().toISOString() : undefined,
        modified: true,
        updated_at: new Date().toISOString(),
      })

      if (correct) {
        const { error } = await supabase.rpc('add_xp', { user_id: user.id, xp_amount: srs.xpGained })
        if (!error) setXpEarned(prev => prev + srs.xpGained)
      }
    }

    setTimeout(() => {
      const next = currentIndex + 1
      if (next < cards.length) {
        setCurrentIndex(next)
        setSelected(null)
        setIsCorrect(null)
        setCorrectAnswer(cards[next].pinyin)
      } else {
        loadCards()
      }
    }, 800)
  }, [selected, phase, cards, currentIndex, supabase, loadCards])

  useEffect(() => {
    if (cards.length > 0 && cards[currentIndex]) {
      const c = cards[currentIndex]
      setCorrectAnswer(c.pinyin)
      const wrong = cards
        .filter(other => other.id !== c.id)
        .map(other => other.pinyin)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
      setOptions([c.pinyin, ...wrong].sort(() => Math.random() - 0.5))
    }
  }, [cards, currentIndex])

  const currentCard = cards[currentIndex]

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Timer selection */}
      {phase === 'select' && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⚡</div>
          <h1 className="text-2xl font-bold text-[#f59e0b] mb-2">Speed Review</h1>
          <p className="text-sm text-[#6b7280] mb-8">Responde tantas cartas como puedas antes de que el tiempo se acabe</p>

          <div className="flex gap-3 justify-center mb-8">
            {TIMER_OPTIONS.map(t => (
              <button
                key={t}
                onClick={() => setTimerSecs(t)}
                className={`px-6 py-3 rounded-xl font-bold text-lg transition-colors ${
                  timerSecs === t
                    ? 'bg-[#f59e0b] text-black'
                    : 'bg-[#1a1a2e] text-[#f0e6d0] border border-[#2d2d44] hover:border-[#f59e0b]'
                }`}
              >
                {t < 60 ? `${t}s` : `${t / 60}m`}
              </button>
            ))}
          </div>

          <button
            onClick={() => startGame(timerSecs)}
            className="bg-[#7c3aed] text-white font-bold px-10 py-4 rounded-2xl text-xl hover:bg-[#6d28d9] transition-colors shadow-lg"
          >
            ¡Comenzar!
          </button>
        </div>
      )}

      {/* Playing */}
      {phase === 'playing' && (
        <>
          {/* Timer + Score bar */}
          <div className="flex items-center justify-between mb-4">
            <div className={`text-2xl font-bold font-mono ${timeLeft <= 10 ? 'text-[#ef4444] animate-pulse' : 'text-[#f0e6d0]'}`}>
              ⏱ {formatTime(timeLeft)}
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-[#f59e0b]">{score}</div>
              <div className="text-xs text-[#6b7280]">puntos</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-[#1a1a2e] rounded-full mb-6 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${timeLeft <= 10 ? 'bg-[#ef4444]' : 'bg-[#f59e0b]'}`}
              style={{ width: `${(timeLeft / timerSecs) * 100}%` }}
            />
          </div>

          {/* Streak */}
          {currentStreak >= 3 && (
            <div className="text-center text-sm text-[#f59e0b] font-bold mb-2">
              🔥 {currentStreak} seguidos!
            </div>
          )}

          {/* Card */}
          {loading ? (
            <div className="text-center py-20 text-[#6b7280] animate-pulse">Cargando...</div>
          ) : currentCard ? (
            <div className="bg-[#1a1a2e] border border-[#2d2d44] rounded-2xl p-8 text-center">
              <div className="flex justify-center mb-3">
                <LiliAvatar
                  expression={
                    currentCard.userCard?.revenge_marked && !selected ? 'uwu'
                    : selected ? (isCorrect ? 'happy' : 'crysmile')
                    : 'cool'
                  }
                  size={48}
                />
              </div>
              <div className="flex items-center justify-center gap-3 mb-4">
                <AudioButton audioUrl={currentCard.audio_path} hanzi={currentCard.hanzi} pinyin={currentCard.pinyin} />
              </div>
              <div className="text-5xl mb-6 font-bold text-[#f0e6d0] tracking-wider">
                {currentCard.hanzi}
              </div>

              {/* Feedback */}
              {selected && (
                <div className={`text-lg font-bold mb-4 ${isCorrect ? 'text-[#34d399]' : 'text-[#ef4444]'}`}>
                  {isCorrect ? '✓ +10' : `✗ ${currentCard.pinyin}`}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleAnswer(opt)}
                    disabled={selected !== null}
                    className={`p-4 rounded-xl text-sm font-medium transition-all ${
                      selected === opt
                        ? isCorrect
                          ? 'bg-[#34d399] text-black scale-95'
                          : 'bg-[#ef4444] text-white scale-95'
                        : selected !== null && opt === currentCard.pinyin
                        ? 'bg-[#34d399]/20 border border-[#34d399] text-[#34d399]'
                        : 'bg-[#0f0f1a] border border-[#2d2d44] text-[#f0e6d0] hover:border-[#f59e0b]'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <div className="text-xs text-[#6b7280] mt-4">
                {currentIndex + 1} cartas • racha: {currentStreak}
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-[#6b7280] animate-pulse">Preparando cartas...</div>
          )}
        </>
      )}

      {/* Results */}
      {phase === 'done' && (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">⚡</div>
          <h1 className="text-2xl font-bold text-[#f59e0b] mb-2">¡Tiempo!</h1>

          <div className="bg-[#1a1a2e] border border-[#2d2d44] rounded-2xl p-6 mb-6 space-y-3">
            <div className="flex justify-between text-lg">
              <span className="text-[#6b7280]">Puntaje</span>
              <span className="text-[#f59e0b] font-bold">{score}</span>
            </div>
            <div className="flex justify-between text-lg">
              <span className="text-[#6b7280]">Correctas</span>
              <span className="text-[#34d399] font-bold">{correctCount}/{totalAnswered}</span>
            </div>
            <div className="flex justify-between text-lg">
              <span className="text-[#6b7280]">Precisión</span>
              <span className="text-[#f0e6d0] font-bold">
                {totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0}%
              </span>
            </div>
            <div className="flex justify-between text-lg">
              <span className="text-[#6b7280]">Mejor racha</span>
              <span className="text-[#f59e0b] font-bold">{bestStreak} 🔥</span>
            </div>
            <div className="border-t border-[#2d2d44] pt-3 flex justify-between text-lg">
              <span className="text-[#6b7280]">XP ganado</span>
              <span className="text-[#a78bfa] font-bold">+{xpEarned}</span>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => startGame(timerSecs)}
              className="bg-[#f59e0b] text-black font-bold px-8 py-3 rounded-xl hover:bg-[#d97706] transition-colors"
            >
              Otra vez
            </button>
            <button
              onClick={() => { setPhase('select'); if (timerRef.current) clearInterval(timerRef.current) }}
              className="bg-[#2d2d44] text-[#f0e6d0] px-6 py-3 rounded-xl hover:bg-[#3d3d54] transition-colors"
            >
              Cambiar tiempo
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
