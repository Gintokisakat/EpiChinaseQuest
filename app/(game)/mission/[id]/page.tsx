'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { calculateDamage } from '@/lib/game/damage'
import { getRandomPowerUps } from '@/lib/game/powerups'
import type { Mission, Card, PowerUp } from '@/types'
import { useParams } from 'next/navigation'

export default function MissionPage() {
  const { id } = useParams()
  const [mission, setMission] = useState<Mission | null>(null)
  const [poolCards, setPoolCards] = useState<Card[]>([])
  const [currentCard, setCurrentCard] = useState<Card | null>(null)
  const [options, setOptions] = useState<string[]>([])
  const [bossHp, setBossHp] = useState(0)
  const [bossMaxHp, setBossMaxHp] = useState(0)
  const [lives, setLives] = useState(3)
  const [timeLeft, setTimeLeft] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [status, setStatus] = useState<'loading' | 'ready' | 'playing' | 'powerup' | 'victory' | 'defeat'>('loading')
  const [powerUps, setPowerUps] = useState<PowerUp[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadMission()
  }, [id])

  useEffect(() => {
    if (status === 'playing' && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000)
    }
    if (status === 'playing' && timeLeft <= 0) {
      setStatus('defeat')
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [timeLeft, status])

  const loadMission = async () => {
    const { data } = await supabase
      .from('missions')
      .select('*')
      .eq('boss_id', id)
      .single()
    if (data) {
      setMission(data as Mission)
      setBossHp(data.hp)
      setBossMaxHp(data.hp)
      setLives(data.lives)
      setTimeLeft(data.timer_secs)

      // Load card pool
      const pool = data.card_pool as { levels?: number[]; units?: number[] }
      let query = supabase.from('cards').select('*')
      if (pool.levels && pool.levels.length > 0) query = query.in('level', pool.levels)
      if (pool.units && pool.units.length > 0) query = query.in('unit', pool.units)
      const { data: cards } = await query.limit(500)
      if (cards && cards.length > 0) {
        setPoolCards(cards as Card[])
        pickCard(cards as Card[])
      }
      setStatus('ready')
    }
  }

  const pickCard = (pool: Card[]) => {
    const card = pool[Math.floor(Math.random() * pool.length)]
    setCurrentCard(card)

    const correct = card.pinyin
    const wrongPool = pool.filter(c => c.id !== card.id)
    const wrong = wrongPool.sort(() => Math.random() - 0.5).slice(0, 3)
    const opts = [correct, ...wrong.map(c => c.pinyin)].sort(() => Math.random() - 0.5)
    setOptions(opts)
    setSelected(null)
    setResult(null)
  }

  const getCardMultiplier = () => {
    const r = Math.random()
    if (r < 0.43) return 1
    if (r < 0.58) return 2
    if (r < 0.65) return 0.5
    if (r < 0.75) return 1
    return 1
  }

  const handleAnswer = async (answer: string) => {
    if (selected || status !== 'playing' || !currentCard) return
    setSelected(answer)

    const correct = answer === currentCard.pinyin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (correct) {
      const mult = getCardMultiplier()
      const { data: profile } = await supabase.from('profiles').select('level, daily_streak').eq('id', user.id).single()
      const dmg = calculateDamage(0, profile?.level || 1, profile?.daily_streak || 0, mult)
      const newHp = Math.max(0, bossHp - dmg)
      const newCorrect = correctCount + 1

      setBossHp(newHp)
      setScore(s => s + dmg)
      setStreak(s => s + 1)
      setCorrectCount(newCorrect)
      setResult('correct')

      await supabase.rpc('add_xp', { user_id: user.id, xp_amount: dmg })

      if (newHp <= 0) {
        setTimeout(async () => {
          setStatus('victory')
          const { data: existingUm } = await supabase
            .from('user_missions')
            .select('id')
            .eq('user_id', user.id)
            .eq('mission_id', mission!.id)
            .maybeSingle()
          supabase.from('user_missions').upsert({
            id: existingUm?.id || undefined,
            user_id: user.id,
            mission_id: mission!.id,
            status: 'completed',
            high_score: score + dmg,
            completed_at: new Date().toISOString(),
          })
        }, 1000)
        return
      }

      if (newCorrect % 5 === 0) {
        setTimeout(() => {
          setPowerUps(getRandomPowerUps(3))
          setStatus('powerup')
        }, 1000)
        return
      }
    } else {
      const newLives = lives - 1
      setLives(newLives)
      setStreak(0)
      setResult('wrong')

      if (newLives <= 0) {
        setTimeout(() => setStatus('defeat'), 1000)
        return
      }
    }

    setTimeout(() => pickCard(poolCards), 1000)
  }

  const applyPowerUp = (pu: PowerUp) => {
    setStatus('playing')
    if (pu.effect.damage) setScore(s => s + Math.floor(score * (pu.effect.damage as number) / 100))
    if (pu.effect.time) setTimeLeft(t => t + (pu.effect.time as number))
    if (pu.effect.life) setLives(l => l + (pu.effect.life as number))
    pickCard(poolCards)
  }

  const startGame = () => setStatus('playing')

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-4xl animate-pulse">⚔️</div>
      </div>
    )
  }

  if (status === 'victory') {
    return (
      <div className="text-center py-20 max-w-sm mx-auto">
        <div className="text-6xl mb-4">🏆</div>
        <h2 className="text-2xl font-bold text-[#f59e0b] mb-2">¡VICTORIA!</h2>
        <p className="text-[#6b7280] mb-2">{mission?.display_name} derrotado</p>
        <p className="text-xl font-bold text-[#f0e6d0] mb-6">{score} pts</p>
        <a href="/map" className="inline-block bg-[#f59e0b] text-black font-bold px-6 py-2 rounded-xl">Volver al mapa</a>
      </div>
    )
  }

  if (status === 'defeat') {
    return (
      <div className="text-center py-20 max-w-sm mx-auto">
        <div className="text-6xl mb-4">💀</div>
        <h2 className="text-2xl font-bold text-[#ef4444] mb-2">Derrota</h2>
        <p className="text-[#6b7280] mb-2">Has caído en {mission?.display_name}</p>
        <p className="text-xl font-bold text-[#f0e6d0] mb-6">{score} pts</p>
        <button onClick={() => { setStatus('loading'); loadMission() }} className="bg-[#f59e0b] text-black font-bold px-6 py-2 rounded-xl mr-2">Reintentar</button>
        <a href="/map" className="inline-block bg-[#1a1a2e] border border-[#2d2d44] text-[#f0e6d0] font-bold px-6 py-2 rounded-xl">Mapa</a>
      </div>
    )
  }

  if (status === 'powerup' && powerUps.length > 0) {
    return (
      <div className="text-center py-10 max-w-lg mx-auto">
        <div className="text-5xl mb-4">⚡</div>
        <h2 className="text-xl font-bold text-[#f0e6d0] mb-6">¡Elige tu poder!</h2>
        <div className="grid grid-cols-1 gap-3">
          {powerUps.map(pu => (
            <button
              key={pu.id}
              onClick={() => applyPowerUp(pu)}
              className="bg-[#1a1a2e] border border-[#2d2d44] rounded-xl p-4 hover:border-[#f59e0b] transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{pu.emoji}</span>
                <div>
                  <div className="font-bold text-[#f0e6d0]">{pu.name}</div>
                  <div className="text-sm text-[#6b7280]">{pu.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Boss HP Bar */}
      <div className="bg-[#1a1a2e] border border-[#2d2d44] rounded-xl p-4 mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="font-bold text-[#f0e6d0]">{mission?.display_name}</span>
          <span className="text-sm text-[#ef4444]">❤️ {lives}</span>
        </div>
        <div className="w-full h-3 bg-[#2d2d44] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${(bossHp / bossMaxHp) * 100}%`,
              background: bossHp / bossMaxHp > 0.5 ? '#34d399' : bossHp / bossMaxHp > 0.25 ? '#fbbf24' : '#ef4444',
            }}
          />
        </div>
        <div className="flex justify-between mt-1 text-xs text-[#6b7280]">
          <span>HP: {bossHp}/{bossMaxHp}</span>
          <span>{score} pts</span>
          <span>⏱️ {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</span>
        </div>
      </div>

      {/* Ready screen */}
      {status === 'ready' && (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">⚔️</div>
          <h2 className="text-xl font-bold text-[#f0e6d0] mb-2">¿Listo?</h2>
          <p className="text-sm text-[#6b7280] mb-6">Responde correctamente para derrotar al jefe</p>
          <button onClick={startGame} className="bg-[#f59e0b] text-black font-bold px-8 py-3 rounded-xl text-lg">
            ¡Comenzar!
          </button>
        </div>
      )}

      {/* Game */}
      {status === 'playing' && currentCard && (
        <>
          <div className="bg-[#1a1a2e] border border-[#2d2d44] rounded-2xl p-8 text-center mb-4">
            <div className="text-5xl mb-2 font-bold text-[#f0e6d0] tracking-wider">{currentCard.hanzi}</div>
            <div className="text-xs text-[#6b7280]">L{currentCard.level} · {currentCard.pos || '—'}</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {options.map(opt => (
              <button
                key={opt}
                onClick={() => handleAnswer(opt)}
                disabled={selected !== null}
                className={`p-4 rounded-xl text-sm font-medium transition-all ${
                  selected === opt
                    ? result === 'correct'
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

          <div className="text-center mt-4 text-sm text-[#6b7280]">
            Racha: {streak} 🔥 · Aciertos: {correctCount}
          </div>
        </>
      )}
    </div>
  )
}
