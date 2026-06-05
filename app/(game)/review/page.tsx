'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { processSrsAnswer, type SrsBox } from '@/lib/game/srs'
import type { Card, UserCard } from '@/types'

type QuizMode = 'pinyin' | 'meaning' | 'hanzi'
type QueueType = 'revise1' | 'revise2' | 'known' | 'unit'

export default function ReviewPage() {
  const [mode, setMode] = useState<QuizMode>('pinyin')
  const [queueType, setQueueType] = useState<QueueType>('revise1')
  const [cards, setCards] = useState<(Card & { userCard?: UserCard })[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [options, setOptions] = useState<string[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [xpGained, setXpGained] = useState(0)
  const [units, setUnits] = useState<{ level: number; unit: number; count: number }[]>([])
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadUnits()
    loadQueue('revise1')
  }, [])

  const loadUnits = async () => {
    const { data } = await supabase
      .from('cards')
      .select('level, unit')
      .order('level')
      .order('unit')

    if (data) {
      const map = new Map<string, number>()
      for (const c of data) {
        const key = `L${c.level} U${c.unit}`
        map.set(key, (map.get(key) || 0) + 1)
      }
      setUnits(Array.from(map.entries()).map(([k, count]) => {
        const [l, u] = k.split(' U')
        return { level: parseInt(l.replace('L', '')), unit: parseInt(u), count }
      }))
    }
  }

  const loadQueue = async (type: QueueType, unitKey?: string) => {
    setLoading(true)
    setCurrentIndex(0)
    setSelected(null)
    setIsCorrect(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let query = supabase
      .from('user_cards')
      .select('*, card:card_id(*)')
      .eq('user_id', user.id)

    if (type === 'known') query = query.eq('known', true)
    else if (type === 'revise1') query = query.eq('revise1', true)
    else if (type === 'revise2') query = query.eq('revise2', true)
    else if (type === 'unit' && unitKey) {
      const [levelStr, unitStr] = unitKey.split('-')
      const level = parseInt(levelStr)
      const unit = parseInt(unitStr)
      query = supabase
        .from('cards')
        .select('*')
        .eq('level', level)
        .eq('unit', unit)
    }

    if (type === 'unit' && unitKey) {
      const [levelStr, unitStr] = unitKey.split('-')
      const { data: cardsFromDb } = await supabase
        .from('cards')
        .select('*')
        .eq('level', parseInt(levelStr))
        .eq('unit', parseInt(unitStr))
        .limit(200)

      if (cardsFromDb) {
        setCards(cardsFromDb as (Card & { userCard?: UserCard })[])
        if (cardsFromDb.length > 0) generateOptions(cardsFromDb[0] as Card)
      } else {
        setCards([])
      }
    } else {
      query = query.limit(50)
      const { data: result } = await query

      if (result) {
        const mapped = (result as (UserCard & { card: Card })[]).map(uc => ({
          ...uc.card,
          userCard: { ...uc } as UserCard,
        }))
        setCards(mapped as (Card & { userCard?: UserCard })[])
        if (mapped.length > 0) generateOptions(mapped[0] as Card)
      } else {
        setCards([])
      }
    }
    setLoading(false)
  }

  const generateOptions = (card: Card) => {
    const correct = mode === 'pinyin' ? card.pinyin
      : mode === 'meaning' ? card.english
      : card.hanzi

    const field = mode === 'pinyin' ? 'pinyin' : mode === 'meaning' ? 'english' : 'hanzi'
    supabase.from('cards').select(field)
      .limit(100)
      .then(({ data }) => {
        const allValues = (data || []).map((d: Record<string, unknown>) => d[field] as string).filter(Boolean)
        const wrong = allValues
          .filter(v => v !== correct)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
        const opts = [correct, ...wrong].sort(() => Math.random() - 0.5)
        setOptions(opts)
      })
  }

  const handleAnswer = async (answer: string) => {
    if (selected) return
    setSelected(answer)

    const card = cards[currentIndex]
    if (!card) return

    const correctAnswer = mode === 'pinyin' ? card.pinyin
      : mode === 'meaning' ? card.english
      : card.hanzi
    const correct = answer === correctAnswer
    setIsCorrect(correct)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (queueType !== 'unit' && card.userCard) {
      const currentBox: SrsBox = card.userCard.known ? 'known'
        : card.userCard.revise1 ? 'revise1'
        : 'revise2'
      const result = processSrsAnswer(currentBox, correct)

      const newLevel = card.userCard.card_level + (correct ? 1 : 0)
      await supabase.from('user_cards').upsert({
        user_id: user.id,
        card_id: card.id,
        known: result.newBox === 'known',
        revise1: result.newBox === 'revise1' || (result.newBox === 'revise2' && currentBox === 'known'),
        revise2: result.newBox === 'revise2',
        card_level: newLevel,
        dk_added_at: correct && !card.userCard.known ? new Date().toISOString() : undefined,
        modified: true,
      }, { onConflict: 'user_id,card_id' })

      if (correct) {
        const { error } = await supabase.rpc('add_xp', { user_id: user.id, xp_amount: result.xpGained })
        if (!error) setXpGained(prev => prev + result.xpGained)
      }
    } else if (queueType === 'unit' && correct) {
      const { data: existing } = await supabase
        .from('user_cards')
        .select('id')
        .eq('user_id', user.id)
        .eq('card_id', card.id)
        .maybeSingle()

      if (!existing) {
        await supabase.from('user_cards').insert({
          user_id: user.id,
          card_id: card.id,
          known: true,
          card_level: 1,
          dk_added_at: new Date().toISOString(),
        })
        const { error } = await supabase.rpc('add_xp', { user_id: user.id, xp_amount: 10 })
        if (!error) setXpGained(prev => prev + 10)
      }
    }

    setTimeout(() => {
      const next = currentIndex + 1
      if (next < cards.length) {
        setCurrentIndex(next)
        setSelected(null)
        setIsCorrect(null)
        generateOptions(cards[next])
      } else {
        setCards([])
        setCurrentIndex(0)
      }
    }, 1200)
  }

  const currentCard = cards[currentIndex]
  const remaining = cards.length - currentIndex

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-[#f59e0b]">📚 Repaso</h1>
        <p className="text-sm text-[#6b7280]">XP ganado esta sesión: {xpGained}</p>
      </div>

      {/* Queue selector */}
      <div className="flex flex-wrap gap-2 mb-6 justify-center">
        <button
          onClick={() => { setQueueType('revise1'); loadQueue('revise1') }}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${queueType === 'revise1' ? 'bg-[#f59e0b] text-black' : 'bg-[#1a1a2e] text-[#f0e6d0] border border-[#2d2d44]'}`}
        >
          A Repasar
        </button>
        <button
          onClick={() => { setQueueType('revise2'); loadQueue('revise2') }}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${queueType === 'revise2' ? 'bg-[#f59e0b] text-black' : 'bg-[#1a1a2e] text-[#f0e6d0] border border-[#2d2d44]'}`}
        >
          Confirmar
        </button>
        <button
          onClick={() => { setQueueType('known'); loadQueue('known') }}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${queueType === 'known' ? 'bg-[#f59e0b] text-black' : 'bg-[#1a1a2e] text-[#f0e6d0] border border-[#2d2d44]'}`}
        >
          Conocidas
        </button>
      </div>

      {/* Mode selector */}
      <div className="flex gap-2 mb-6 justify-center">
        {(['pinyin', 'meaning', 'hanzi'] as QuizMode[]).map(m => (
          <button
            key={m}
            onClick={() => { setMode(m); if (currentCard) generateOptions(currentCard) }}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${mode === m ? 'bg-[#7c3aed] text-white' : 'bg-[#1a1a2e] text-[#f0e6d0] border border-[#2d2d44]'}`}
          >
            {m === 'pinyin' ? 'Pinyin' : m === 'meaning' ? 'Significado' : 'Hanzi'}
          </button>
        ))}
      </div>

      {/* Unit study */}
      <details className="mb-6">
        <summary className="text-sm text-[#a78bfa] cursor-pointer hover:text-[#f59e0b]">Estudiar por unidad</summary>
        <div className="mt-2 max-h-60 overflow-y-auto space-y-1">
          {units.map(u => (
            <button
              key={`${u.level}-${u.unit}`}
              onClick={() => { setQueueType('unit'); loadQueue('unit', `${u.level}-${u.unit}`) }}
              className="w-full text-left px-3 py-1.5 rounded-lg text-sm text-[#f0e6d0] hover:bg-[#2d2d44] transition-colors"
            >
              L{u.level} · Unidad {u.unit} ({u.count} cards)
            </button>
          ))}
        </div>
      </details>

      {/* Progress */}
      {cards.length > 0 && (
        <div className="text-center text-sm text-[#6b7280] mb-4">
          {currentIndex + 1} / {cards.length} · {remaining} restantes
        </div>
      )}

      {/* Card */}
      {loading ? (
        <div className="text-center py-20 text-[#6b7280] animate-pulse">Cargando...</div>
      ) : currentCard ? (
        <div className="bg-[#1a1a2e] border border-[#2d2d44] rounded-2xl p-8 text-center">
          <div className="text-5xl mb-4 font-bold text-[#f0e6d0] tracking-wider">
            {mode === 'hanzi' ? `${currentCard.pinyin} (${currentCard.english.split(';')[0]})` : currentCard.hanzi}
          </div>
          <div className="text-xs text-[#6b7280] mb-6">
            L{currentCard.level} · {currentCard.pos || '—'}
          </div>

          {/* Feedback */}
          {selected && (
            <div className={`text-lg font-bold mb-4 ${isCorrect ? 'text-[#34d399]' : 'text-[#ef4444]'}`}>
              {isCorrect ? '✓ ¡Correcto!' : '✗ Incorrecto'}
              {isCorrect && ' +XP'}
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
                    : selected !== null && opt === (mode === 'pinyin' ? currentCard.pinyin : mode === 'meaning' ? currentCard.english : currentCard.hanzi)
                    ? 'bg-[#34d399]/20 border border-[#34d399] text-[#34d399]'
                    : 'bg-[#0f0f1a] border border-[#2d2d44] text-[#f0e6d0] hover:border-[#f59e0b]'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-xl font-bold text-[#f0e6d0] mb-2">¡Repaso completado!</h2>
          <p className="text-sm text-[#6b7280] mb-6">No hay más cartas en esta cola.</p>
          <button
            onClick={() => loadQueue('revise1')}
            className="bg-[#f59e0b] text-black font-bold px-6 py-2 rounded-xl hover:bg-[#d97706] transition-colors"
          >
            Repetir cola
          </button>
        </div>
      )}
    </div>
  )
}
