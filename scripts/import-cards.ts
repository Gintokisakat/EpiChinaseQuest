import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, serviceRoleKey)

const CARDS_FILE = '/tmp/hsk30/cards.json'

interface RawCard {
  hanzi: string
  pinyin: string
  pos: string
  level: number
  english: string
  audio: string
}

async function importCards() {
  console.log('Reading cards.json...')
  const raw = JSON.parse(fs.readFileSync(CARDS_FILE, 'utf-8')) as RawCard[]
  console.log(`Total cards to import: ${raw.length}`)

  // Count cards per level for unit assignment
  const levelCounts: Record<number, number> = {}
  for (const card of raw) {
    levelCounts[card.level] = (levelCounts[card.level] || 0) + 1
  }
  console.log('Cards per level:', levelCounts)

  // Assign units: 30 cards per unit in level 1, then adjust proportionally
  const CARDS_PER_UNIT = 30
  const levelUnitConfig: Record<number, number> = {
    1: 10,   // 300 cards / 30 = 10 units
    2: 8,    // 200 / 25 = 8 units
    3: 10,   // 500 / 50 = 10 units
    4: 20,   // 1000 / 50 = 20 units
    5: 32,   // 1600 / 50 = 32 units
    6: 36,   // 1800 / 50 = 36 units
    7: 70,   // 5600 / 80 = 70 units
  }

  // Pre-compute horoscope categories (first 12 categories, 12 cards each)
  const horoscopeCategories = [
    'colores', 'frutas', 'verduras', 'comidas', 'animales', 'deportes',
    'hobbies', 'ropa', 'casa', 'cuerpo', 'profesiones', 'emociones',
  ]

  console.log('Preparing batch inserts...')
  const BATCH_SIZE = 500
  let inserted = 0
  let batch: Record<string, unknown>[] = []

  for (const card of raw) {
    const level = card.level
    const levelCards = raw.filter(c => c.level === level)
    const cardIndex = levelCards.indexOf(card)
    const totalUnits = levelUnitConfig[level] || 10
    const cardsPerUnit = Math.ceil(levelCounts[level] / totalUnits)
    const unit = Math.min(Math.floor(cardIndex / cardsPerUnit) + 1, totalUnits)

    const horoscopeIndex = unit % 12
    const isHoroscope = level === 1 && unit <= 12

    const record = {
      hanzi: card.hanzi,
      pinyin: card.pinyin,
      pos: card.pos,
      level,
      english: card.english,
      audio_path: card.audio ? `audio/${card.audio}` : null,
      unit,
      is_horoscope: isHoroscope,
      horoscope_category: isHoroscope ? horoscopeCategories[horoscopeIndex] : null,
    }
    batch.push(record)

    if (batch.length >= BATCH_SIZE) {
      const { error } = await supabase.from('cards').insert(batch)
      if (error) {
        console.error('Batch insert error:', error)
        process.exit(1)
      }
      inserted += batch.length
      console.log(`Inserted ${inserted}/${raw.length} cards...`)
      batch = []
    }
  }

  // Insert remaining
  if (batch.length > 0) {
    const { error } = await supabase.from('cards').insert(batch)
    if (error) {
      console.error('Final batch insert error:', error)
      process.exit(1)
    }
    inserted += batch.length
  }

  console.log(`✅ Done! Imported ${inserted} cards.`)
}

importCards().catch(console.error)
