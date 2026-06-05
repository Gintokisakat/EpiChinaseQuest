'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { processSrsAnswer, type SrsBox } from '@/lib/game/srs'
import type { Card, UserCard } from '@/types'

export type QuizMode = 'pinyin' | 'meaning' | 'hanzi'

export function useSRS() {
  const [cards, setCards] = useState<(Card & { userCard?: UserCard })[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [options, setOptions] = useState<string[]>([])
  const [mode, setMode] = useState<QuizMode>('pinyin')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const currentCard = cards[currentIndex] ?? null

  const loadReviewQueue = useCallback(async (
    userId: string,
    queueType: 'known' | 'revise1' | 'revise2' = 'revise1'
  ) => {
    setLoading(true)
    const { data: userCards } = await supabase
      .from('user_cards')
      .select('*, card:card_id(*)')
      .eq('user_id', userId)
      .eq(queueType === 'known' ? 'known' : queueType === 'revise1' ? 'revise1' : 'revise2', true)
      .limit(50)

    if (userCards) {
      const mapped = userCards.map((uc: Record<string, unknown>) => ({
        ...(uc.card as Card),
        userCard: uc as unknown as UserCard,
      }))
      setCards(mapped)
      setCurrentIndex(0)
      generateOptions(mapped[0], mode)
    }
    setLoading(false)
  }, [supabase, mode])

  const generateOptions = (card: Card, quizMode: QuizMode) => {
    if (!card) return
    const correct = quizMode === 'pinyin' ? card.pinyin
      : quizMode === 'meaning' ? card.english
      : card.hanzi
    const wrongOptions = ['选项A', '选项B', '选项C']
    const allOptions = [correct, ...wrongOptions].sort(() => Math.random() - 0.5)
    setOptions(allOptions)
  }

  const answer = useCallback(async (
    userId: string,
    selected: string,
    cardId: string
  ) => {
    const card = cards[currentIndex]
    if (!card) return { correct: false, xpGained: 0 }

    const correctAnswer = mode === 'pinyin' ? card.pinyin
      : mode === 'meaning' ? card.english
      : card.hanzi
    const isCorrect = selected === correctAnswer

    const currentBox: SrsBox = card.userCard?.known ? 'known'
      : card.userCard?.revise1 ? 'revise1'
      : 'revise2'
    const result = processSrsAnswer(currentBox, isCorrect)

    const updates: Partial<UserCard> = {
      known: result.newBox === 'known',
      revise1: result.newBox === 'revise1' || result.newBox === 'revise2' && currentBox === 'known',
      revise2: result.newBox === 'revise2',
      modified: true,
    }

    if (isCorrect && !card.userCard?.known) {
      updates.dk_added_at = new Date().toISOString()
    }

    await supabase
      .from('user_cards')
      .upsert({
        user_id: userId,
        card_id: cardId,
        ...updates,
      })

    if (isCorrect) {
      await supabase.rpc('add_xp', { user_id: userId, xp_amount: result.xpGained })
    }

    setCurrentIndex(prev => prev + 1)
    if (cards[currentIndex + 1]) {
      generateOptions(cards[currentIndex + 1], mode)
    }

    return { correct: isCorrect, xpGained: result.xpGained }
  }, [cards, currentIndex, mode, supabase])

  return {
    cards,
    currentCard,
    currentIndex,
    options,
    mode,
    loading,
    loadReviewQueue,
    answer,
    setMode,
    total: cards.length,
    remaining: cards.length - currentIndex,
  }
}
