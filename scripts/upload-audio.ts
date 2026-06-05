import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, serviceRoleKey)

const AUDIO_DIR = '/tmp/hsk30'
const BUCKET_NAME = 'audio'

interface RawCard {
  hanzi: string
  pinyin: string
  pos: string
  level: number
  english: string
  audio: string
}

async function uploadAudio() {
  // Read cards to know which audio files are needed
  const raw = JSON.parse(fs.readFileSync(path.join(AUDIO_DIR, 'cards.json'), 'utf-8')) as RawCard[]

  // Get unique audio filenames (strip .mp3 from reference, as files on disk don't have it)
  const audioFiles = new Map<string, string>()
  for (const card of raw) {
    if (!card.audio) continue
    const filename = card.audio.replace('.mp3', '')
    audioFiles.set(filename, card.audio)
  }

  console.log(`Unique audio files referenced: ${audioFiles.size}`)

  // Ensure bucket exists
  const { data: buckets } = await supabase.storage.listBuckets()
  const bucketExists = buckets?.some(b => b.name === BUCKET_NAME)

  if (!bucketExists) {
    const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: 5242880, // 5MB
    })
    if (error) {
      console.error('Failed to create bucket:', error)
      process.exit(1)
    }
    console.log(`Created bucket: ${BUCKET_NAME}`)
  }

  // Upload files
  let uploaded = 0
  let errors = 0
  const BATCH_SIZE = 50
  let batch: Promise<void>[] = []

  for (const [diskName, storageName] of audioFiles) {
    const filePath = path.join(AUDIO_DIR, diskName)
    if (!fs.existsSync(filePath)) {
      errors++
      continue
    }

    const fileBuffer = fs.readFileSync(filePath)
    const mimeType = 'audio/mpeg'
    const storagePath = storageName

    const upload = supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, fileBuffer, {
        contentType: mimeType,
        upsert: true,
      })
      .then(({ error }) => {
        if (error) {
          console.error(`Failed to upload ${storageName}:`, error.message)
          errors++
        } else {
          uploaded++
          if (uploaded % 500 === 0) {
            console.log(`Uploaded ${uploaded}/${audioFiles.size} audio files...`)
          }
        }
      })

    batch.push(upload)

    if (batch.length >= BATCH_SIZE) {
      await Promise.all(batch)
      batch = []
    }
  }

  // Wait for remaining
  if (batch.length > 0) {
    await Promise.all(batch)
  }

  console.log(`\n✅ Done! Uploaded: ${uploaded}, Errors: ${errors}`)

  // Update cards with public URLs
  console.log('Updating card audio_path with public URLs...')
  const { data: cards } = await supabase.from('cards').select('id, audio_path').not('audio_path', 'is', null)
  if (cards) {
    for (const card of cards) {
      const { data: { publicUrl } } = supabase.storage.from(BUCKET_NAME).getPublicUrl(card.audio_path!)
      await supabase.from('cards').update({ audio_path: publicUrl }).eq('id', card.id)
    }
    console.log(`Updated ${cards.length} card audio paths.`)
  }
}

uploadAudio().catch(console.error)
