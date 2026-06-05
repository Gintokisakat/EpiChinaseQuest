export interface Card {
  id: string
  hanzi: string
  pinyin: string
  pos: string
  level: number
  english: string
  audio_path: string | null
}

export interface Profile {
  id: string
  username: string | null
  display_name: string | null
  xp: number
  level: number
  daily_streak: number
  last_played_date: string | null
  created_at: string
}

export interface UserCard {
  id: string
  user_id: string
  card_id: string
  known: boolean
  revise1: boolean
  revise2: boolean
  card_level: number
  challenge_streak: number
  challenge_best: number
  revenge_marked: boolean
  dk_added_at: string | null
  modified?: boolean
  updated_at?: string
}

export interface Character {
  id: string
  name: string
  rarity: string
  emoji: string
  description: string | null
}

export interface UserCharacter {
  id: string
  user_id: string
  character_id: string
  xp: number
  is_equipped: boolean
}

export interface Mission {
  id: string
  boss_id: string
  name: string
  display_name: string
  hp: number
  timer_secs: number
  lives: number
  card_pool: Record<string, unknown>
  color: string
}

export interface UserMission {
  id: string
  user_id: string
  mission_id: string
  status: 'locked' | 'unlocked' | 'completed'
  high_score: number
  completed_at: string | null
}

export interface BossState {
  mission: Mission
  bossHp: number
  bossMaxHp: number
  playerHp: number
  timeLeft: number
  lives: number
  score: number
  streak: number
  correctAnswers: number
  currentCard: Card | null
  options: string[]
  isPowerUp: boolean
  powerUpChoices: PowerUp[]
  phase: number
}

export interface PowerUp {
  id: string
  name: string
  description: string
  effect: Record<string, number>
  color: string
  emoji: string
}
