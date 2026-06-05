import type { PowerUp } from '@/types'

export const POWER_UPS: PowerUp[] = [
  { id: 'heroic', name: 'Heroico', description: '+10% daño', effect: { damage: 10 }, color: 'red', emoji: '⚔️' },
  { id: 'master', name: 'Maestro', description: '+20% daño', effect: { damage: 20 }, color: 'red', emoji: '⚡' },
  { id: 'celestial', name: 'Celestial', description: '+100% daño', effect: { damage: 100 }, color: 'red', emoji: '💫' },
  { id: 'winTime', name: 'Ganar Tiempo', description: '+10 segundos', effect: { time: 10 }, color: 'cyan', emoji: '⏰' },
  { id: 'dominateTime', name: 'Dominar Tiempo', description: '+20 segundos', effect: { time: 20 }, color: 'cyan', emoji: '⏱️' },
  { id: 'controlTime', name: 'Control Tiempo', description: '+30 segundos', effect: { time: 30 }, color: 'cyan', emoji: '⌛' },
  { id: 'exchange', name: 'Intercambio', description: '+25% daño, -20s', effect: { damage: 25, time: -20 }, color: 'gold', emoji: '🔄' },
  { id: 'trustMe', name: 'Confía en mí', description: '+40% daño, -35s', effect: { damage: 40, time: -35 }, color: 'gold', emoji: '🤝' },
  { id: 'allOrNothing', name: 'Todo o nada', description: '+100% daño, -60s', effect: { damage: 100, time: -60 }, color: 'gold', emoji: '🎲' },
  { id: 'sacrificePower', name: 'Sacrificio Poder', description: '+25% daño, -1 vida', effect: { damage: 25, life: -1 }, color: 'teal', emoji: '🔥' },
  { id: 'sacrificeTime', name: 'Sacrificio Tiempo', description: '+25 segundos, -1 vida', effect: { time: 25, life: -1 }, color: 'teal', emoji: '⏳' },
  { id: 'costWhatCost', name: 'Cueste lo que cueste', description: '+60% daño, -1 vida', effect: { damage: 60, life: -1 }, color: 'teal', emoji: '💀' },
  { id: 'rescue', name: 'Rescate', description: '+20s, +1 vida', effect: { time: 20, life: 1 }, color: 'teal', emoji: '🛟' },
  { id: 'divineLight', name: 'Luz Divina', description: '+25% daño, +20s, +1 vida', effect: { damage: 25, time: 20, life: 1 }, color: 'yellow', emoji: '✨' },
]

export function getRandomPowerUps(count: number = 3): PowerUp[] {
  const shuffled = [...POWER_UPS].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}
