'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Card } from '@/types'

type Phase = 'select' | 'study' | 'quiz' | 'done'

export default function LearnPage() {
  const [phase, setPhase] = useState<Phase>('select')
  const [units, setUnits] = useState<{ level: number; unit: number; count: number }[]>([])
  const [selectedLevel, setSelectedLevel] = useState(1)
  const [selectedUnit, setSelectedUnit] = useState(1)
  const [cards, setCards] = useState<Card[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [knownCount, setKnownCount] = useState(0)
  const [options, setOptions] = useState<string[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [score, setScore] = useState(0)
  const supabase = createClient()

  useEffect(() => { loadUnits() }, [])

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

  const startUnit = async (level: number, unit: number) => {
    setSelectedLevel(level)
    setSelectedUnit(unit)
    setCurrentIndex(0)
    setFlipped(false)
    setKnownCount(0)
    setScore(0)
    setSelected(null)
    setIsCorrect(null)

    const { data } = await supabase
      .from('cards')
      .select('*')
      .eq('level', level)
      .eq('unit', unit)
      .limit(50)

    if (data && data.length > 0) {
      setCards(data as Card[])
      setPhase('study')
      generateQuizOptions(data as Card[], 0)
    }
  }

  const generateQuizOptions = (allCards: Card[], idx: number) => {
    const card = allCards[idx]
    if (!card) return
    const correct = card.pinyin
    const wrongPool = allCards.filter(c => c.id !== card.id)
    const wrong = wrongPool.sort(() => Math.random() - 0.5).slice(0, 3)
    setOptions([correct, ...wrong.map(c => c.pinyin)].sort(() => Math.random() - 0.5))
  }

  const nextCard = () => {
    const next = currentIndex + 1
    if (next < cards.length) {
      setCurrentIndex(next)
      setFlipped(false)
      setSelected(null)
      setIsCorrect(null)
      generateQuizOptions(cards, next)
    } else {
      // Go to quiz mode
      setPhase('quiz')
      setCurrentIndex(0)
      setSelected(null)
      setIsCorrect(null)
      generateQuizOptions(cards, 0)
    }
  }

  const handleQuizAnswer = (answer: string) => {
    if (selected || !cards[currentIndex]) return
    setSelected(answer)

    const correct = answer === cards[currentIndex].pinyin
    setIsCorrect(correct)

    if (correct) {
      setScore(s => s + 1)
    }

    setTimeout(() => {
      const next = currentIndex + 1
      if (next < cards.length) {
        setCurrentIndex(next)
        setSelected(null)
        setIsCorrect(null)
        generateQuizOptions(cards, next)
      } else {
        finishUnit()
      }
    }, 1200)
  }

  const finishUnit = async () => {
    setPhase('done')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Add all cards in this unit as known
    for (const card of cards) {
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
      }
    }
    await supabase.rpc('add_xp', { user_id: user.id, xp_amount: score * 10 })
  }

  const getLevelEmoji = (level: number) => {
    const emojis = ['🌱', '🌿', '🌳', '🏔️', '⛰️', '🏯', '🐉']
    return emojis[level - 1] || '📚'
  }

  if (phase === 'select') {
    return (
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-[#f59e0b]">📖 Aprender</h1>
          <p className="text-sm text-[#6b7280]">Selecciona una unidad para estudiar</p>
        </div>

        {/* Level selector */}
        <div className="flex flex-wrap gap-2 mb-6 justify-center">
          {[1, 2, 3, 4, 5, 6, 7].map(l => (
            <button
              key={l}
              onClick={() => setSelectedLevel(l)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                selectedLevel === l
                  ? 'bg-[#7c3aed] text-white'
                  : 'bg-[#1a1a2e] text-[#f0e6d0] border border-[#2d2d44]'
              }`}
            >
              {getLevelEmoji(l)} L{l}
            </button>
          ))}
        </div>

        {/* Units grid */}
        <div className="grid grid-cols-2 gap-3">
          {units
            .filter(u => u.level === selectedLevel)
            .map(u => (
              <button
                key={`${u.level}-${u.unit}`}
                onClick={() => startUnit(u.level, u.unit)}
                className="bg-[#1a1a2e] border border-[#2d2d44] rounded-xl p-4 text-left hover:border-[#f59e0b] transition-colors"
              >
                <div className="font-bold text-[#f0e6d0]">Unidad {u.unit}</div>
                <div className="text-xs text-[#6b7280]">{u.count} palabras</div>
              </button>
            ))}
        </div>
      </div>
    )
  }

  if (phase === 'study') {
    const card = cards[currentIndex]
    if (!card) return <div className="text-center py-20 text-[#6b7280]">Cargando...</div>

    return (
      <div className="max-w-lg mx-auto">
        {/* Progress */}
        <div className="flex items-center justify-between mb-4 text-sm">
          <span className="text-[#a78bfa]">Unidad {selectedUnit}</span>
          <span className="text-[#6b7280]">{currentIndex + 1} / {cards.length}</span>
        </div>
        <div className="w-full h-1 bg-[#2d2d44] rounded-full mb-6">
          <div
            className="h-full bg-[#7c3aed] rounded-full transition-all"
            style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
          />
        </div>

        {/* Flashcard */}
        <div
          onClick={() => setFlipped(true)}
          className="bg-[#1a1a2e] border border-[#2d2d44] rounded-2xl p-12 text-center cursor-pointer hover:border-[#f59e0b] transition-all min-h-[250px] flex flex-col items-center justify-center"
        >
          {!flipped ? (
            <>
              <div className="text-xs text-[#6b7280] mb-4">Toca para ver respuesta</div>
              <div className="text-6xl font-bold text-[#f0e6d0] tracking-wider">{card.hanzi}</div>
              <div className="text-sm text-[#6b7280] mt-4">L{card.level} · {card.pos || '—'}</div>
            </>
          ) : (
            <>
              <div className="text-4xl font-bold text-[#f59e0b] mb-2">{card.pinyin}</div>
              <div className="text-sm text-[#f0e6d0] max-w-md">
                {card.english.includes(';') ? card.english.split(';').slice(0, 3).join('; ') : card.english}
              </div>
            </>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={nextCard}
            className="flex-1 bg-[#34d399] text-black font-bold py-3 rounded-xl hover:brightness-110 transition-all"
          >
            ✓ La sé
          </button>
          <button
            onClick={() => {
              if (!flipped) setFlipped(true)
              else nextCard()
            }}
            className="flex-1 bg-[#1a1a2e] border border-[#2d2d44] text-[#f0e6d0] font-bold py-3 rounded-xl hover:border-[#f59e0b] transition-all"
          >
            Siguiente →
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'quiz') {
    const card = cards[currentIndex]
    if (!card) return <div className="text-center py-20 text-[#6b7280]">Cargando...</div>

    return (
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-4">
          <h2 className="text-sm text-[#7c3aed] font-bold">¡Mini Quiz!</h2>
          <p className="text-xs text-[#6b7280]">Elige el pinyin correcto</p>
        </div>

        <div className="text-center mb-4 text-xs text-[#6b7280]">
          {currentIndex + 1} / {cards.length}
        </div>

        <div className="bg-[#1a1a2e] border border-[#2d2d44] rounded-2xl p-8 text-center mb-4">
          <div className="text-5xl font-bold text-[#f0e6d0] tracking-wider mb-2">{card.hanzi}</div>
          <div className="text-xs text-[#6b7280]">L{card.level} · {card.pos || '—'}</div>
        </div>

        {selected && (
          <div className={`text-center text-lg font-bold mb-4 ${isCorrect ? 'text-[#34d399]' : 'text-[#ef4444]'}`}>
            {isCorrect ? '✓ ¡Correcto!' : `✗ Era: ${card.pinyin}`}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {options.map(opt => (
            <button
              key={opt}
              onClick={() => handleQuizAnswer(opt)}
              disabled={selected !== null}
              className={`p-4 rounded-xl text-sm font-medium transition-all ${
                selected === opt
                  ? isCorrect
                    ? 'bg-[#34d399] text-black scale-95'
                    : 'bg-[#ef4444] text-white scale-95'
                  : selected !== null && opt === card.pinyin
                  ? 'bg-[#34d399]/20 border border-[#34d399] text-[#34d399]'
                  : 'bg-[#0f0f1a] border border-[#2d2d44] text-[#f0e6d0] hover:border-[#f59e0b]'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Done
  const percent = cards.length > 0 ? Math.round((score / cards.length) * 100) : 0
  return (
    <div className="max-w-lg mx-auto text-center py-10">
      <div className="text-6xl mb-4">🎉</div>
      <h2 className="text-2xl font-bold text-[#f59e0b] mb-2">¡Unidad completada!</h2>
      <p className="text-[#6b7280] mb-2">{cards.length} palabras estudiadas</p>
      <p className="text-lg font-bold text-[#f0e6d0] mb-6">
        {score}/{cards.length} correctas ({percent}%)
      </p>
      <div className="flex gap-3 justify-center">
        <button
          onClick={() => setPhase('select')}
          className="bg-[#f59e0b] text-black font-bold px-6 py-2 rounded-xl"
        >
          Otra unidad
        </button>
        <a
          href="/review"
          className="bg-[#1a1a2e] border border-[#2d2d44] text-[#f0e6d0] font-bold px-6 py-2 rounded-xl"
        >
          Repasar
        </a>
        <a
          href="/map"
          className="bg-[#1a1a2e] border border-[#2d2d44] text-[#f0e6d0] font-bold px-6 py-2 rounded-xl"
        >
          Cruzada
        </a>
      </div>
    </div>
  )
}
