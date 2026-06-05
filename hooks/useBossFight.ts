'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { calculateDamage } from '@/lib/game/damage'
import { getRandomPowerUps } from '@/lib/game/powerups'
import type { BossState, Card, Mission, PowerUp } from '@/types'

const SPECIAL_CARD_RATES = [
  { type: 'normal', chance: 0.43, levelBonus: 0 },
  { type: 'gold', chance: 0.15, levelBonus: 2 },
  { type: 'mythic', chance: 0.07, levelBonus: 5 },
  { type: 'orange', chance: 0.10, damageMult: 2 },
  { type: 'cyan', chance: 0.05, timeBonus: 20 },
  { type: 'crimson', chance: 0.10, damageMult: 0.5 },
  { type: 'turquoise', chance: 0.10, healAmount: 500 },
]

export function useBossFight() {
  const [state, setState] = useState<BossState | null>(null)
  const [isActive, setIsActive] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const supabase = createClient()
  const poolRef = useRef<Card[]>([])

  const initBoss = useCallback(async (mission: Mission, userId: string) => {
    const poolCards = await loadCardPool(mission.card_pool, supabase)
    poolRef.current = poolCards
    const firstCard = poolCards[Math.floor(Math.random() * poolCards.length)]
    const options = generateOptions(firstCard, poolCards)

    setState({
      mission,
      bossHp: mission.hp,
      bossMaxHp: mission.hp,
      playerHp: 3,
      timeLeft: mission.timer_secs,
      lives: mission.lives,
      score: 0,
      streak: 0,
      correctAnswers: 0,
      currentCard: firstCard,
      options,
      isPowerUp: false,
      powerUpChoices: [],
      phase: 1,
    })
    setIsActive(true)
  }, [supabase])

  const answer = useCallback(async (
    selected: string,
    userId: string,
    playerLevel: number,
    dailyStreak: number
  ) => {
    if (!state || !state.currentCard) return { correct: false, damage: 0 }

    const correctAnswer = state.options[0]
    const isCorrect = selected === correctAnswer

    if (isCorrect) {
      const cardLevel = 0
      const cardMultiplier = getCardMultiplier()
      const damage = calculateDamage(cardLevel, playerLevel, dailyStreak, cardMultiplier)
      const newHp = Math.max(0, state.bossHp - damage)
      const newCorrect = state.correctAnswers + 1

      let newState = {
        ...state,
        bossHp: newHp,
        score: state.score + damage,
        streak: state.streak + 1,
        correctAnswers: newCorrect,
      }

      if (newHp <= 0) {
        setIsActive(false)
        await completeMission(userId, state.mission.id, state.score)
        setState({ ...newState, bossHp: 0 })
        return { correct: true, damage, victory: true }
      }

      if (newCorrect % 5 === 0) {
        newState = {
          ...newState,
          isPowerUp: true,
          powerUpChoices: getRandomPowerUps(3),
        }
      }

      const nextCard = await getNextCard(poolRef.current, newState)
      setState({ ...newState, currentCard: nextCard, options: generateOptions(nextCard, poolRef.current) })
      return { correct: true, damage, victory: false }
    } else {
      const newLives = state.lives - 1
      const newState = { ...state, lives: newLives, streak: 0 }

      if (newLives <= 0) {
        setIsActive(false)
        setState(newState)
        return { correct: false, damage: 0, gameOver: true }
      }

      const nextCard = await getNextCard(poolRef.current, newState)
      setState({ ...newState, currentCard: nextCard, options: generateOptions(nextCard, poolRef.current) })
      return { correct: false, damage: 0, gameOver: false }
    }
  }, [state, supabase])

  const applyPowerUp = useCallback((powerUp: PowerUp) => {
    if (!state) return
    const newState = { ...state, isPowerUp: false, powerUpChoices: [] }
    if (powerUp.effect.damage) newState.score += Math.floor(state.score * powerUp.effect.damage / 100)
    if (powerUp.effect.time) newState.timeLeft += powerUp.effect.time
    if (powerUp.effect.life) newState.lives += powerUp.effect.life
    setState(newState)
  }, [state])

  const tick = useCallback(() => {
    if (!state || !isActive) return
    setState(prev => {
      if (!prev || prev.timeLeft <= 0) {
        setIsActive(false)
        return prev ? { ...prev, timeLeft: 0 } : prev
      }
      return { ...prev, timeLeft: prev.timeLeft - 1 }
    })
  }, [isActive])

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(tick, 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isActive, tick])

  return { state, isActive, initBoss, answer, applyPowerUp }
}

async function getNextCard(pool: Card[], state: BossState): Promise<Card> {
  const randomCard = pool[Math.floor(Math.random() * pool.length)]
  return randomCard
}

async function loadCardPool(pool: Record<string, unknown>, supabase: ReturnType<typeof createClient>): Promise<Card[]> {
  const levels = pool.levels as number[] | undefined
  const units = pool.units as number[] | undefined

  let query = supabase.from('cards').select('*')
  if (levels && levels.length > 0) {
    query = query.in('level', levels)
  }
  if (units && units.length > 0) {
    query = query.in('unit', units)
  }
  const { data } = await query.limit(200)
  return data ?? []
}

function generateOptions(correct: Card, pool: Card[]): string[] {
  const wrong = pool
    .filter(c => c.id !== correct.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 2)
  const options = [correct.pinyin, ...wrong.map(c => c.pinyin)]
  return options.sort(() => Math.random() - 0.5)
}

function getCardMultiplier(): number {
  const roll = Math.random()
  let cumulative = 0
  for (const rate of SPECIAL_CARD_RATES) {
    cumulative += rate.chance
    if (roll <= cumulative) {
      if (rate.damageMult) return rate.damageMult
      return 1
    }
  }
  return 1
}

async function completeMission(userId: string, missionId: string, score: number) {
  const supabase = createClient()
  await supabase.from('user_missions').upsert({
    user_id: userId,
    mission_id: missionId,
    status: 'completed',
    high_score: score,
    completed_at: new Date().toISOString(),
  })
}
