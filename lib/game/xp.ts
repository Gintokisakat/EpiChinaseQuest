export function xpForLevel(level: number): number {
  if (level === 1) return 10
  if (level === 2) return 50
  if (level === 3) return 100
  return (level - 1) * 100
}

export function totalXpForLevel(level: number): number {
  let total = 0
  for (let i = 1; i < level; i++) {
    total += xpForLevel(i)
  }
  return total
}

export function levelFromXp(totalXp: number): number {
  let level = 1
  let accumulated = 0
  while (true) {
    const needed = xpForLevel(level)
    if (accumulated + needed > totalXp) break
    accumulated += needed
    level++
  }
  return level
}

export function xpProgress(totalXp: number): { level: number; currentXp: number; nextLevelXp: number; progress: number } {
  const level = levelFromXp(totalXp)
  const xpForCurrent = totalXpForLevel(level)
  const nextXp = xpForLevel(level)
  const currentXp = totalXp - xpForCurrent
  return {
    level,
    currentXp,
    nextLevelXp: nextXp,
    progress: currentXp / nextXp,
  }
}

export const XP_COLORS = [
  '#7dd3fc', // light blue
  '#38bdf8', // blue
  '#5eead4', // teal
  '#34d399', // green
  '#fbbf24', // yellow
  '#fb923c', // light orange
  '#f97316', // orange
  '#ea580c', // deep orange
]

export function xpColor(level: number): string {
  return XP_COLORS[(level - 1) % XP_COLORS.length]
}
