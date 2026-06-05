export function calculateDamage(
  cardLevel: number,
  playerLevel: number,
  dailyStreak: number,
  multiplier: number = 1,
  upgrades: Record<string, number> = {}
): number {
  const baseDamage = cardLevel + playerLevel * 5 + dailyStreak
  const upgradeBonus = Object.values(upgrades).reduce((sum, val) => sum + val, 0)
  return Math.floor(baseDamage * multiplier * (1 + upgradeBonus / 100))
}

export function calculateScore(
  knownCharsCount: number,
  xpPoints: number,
  currentStreak: number,
  currentLevel: number
): number {
  return Math.round(
    (knownCharsCount + xpPoints) *
      (1 + currentStreak / 100) *
      (1 + currentLevel * 0.05)
  )
}
