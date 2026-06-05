export type SrsBox = 'known' | 'revise1' | 'revise2'

export interface SrsResult {
  correct: boolean
  newBox: SrsBox
  xpGained: number
}

export function processSrsAnswer(
  currentBox: SrsBox,
  correct: boolean
): SrsResult {
  if (correct) {
    if (currentBox === 'known') {
      return { correct: true, newBox: 'known', xpGained: 5 }
    }
    if (currentBox === 'revise1') {
      return { correct: true, newBox: 'known', xpGained: 10 }
    }
    if (currentBox === 'revise2') {
      return { correct: true, newBox: 'known', xpGained: 15 }
    }
  }

  // Incorrect
  if (currentBox === 'known') {
    return { correct: false, newBox: 'revise1', xpGained: 1 }
  }
  if (currentBox === 'revise1') {
    return { correct: false, newBox: 'revise2', xpGained: 0 }
  }
  // revise2 and incorrect
  return { correct: false, newBox: 'revise2', xpGained: 0 }
}

export function shouldMarkRevenge(
  totalAttempts: number,
  correctStreak: number
): boolean {
  return correctStreak < 5
}
