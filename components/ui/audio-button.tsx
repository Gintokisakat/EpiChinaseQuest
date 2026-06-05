'use client'

import { useRef, useState } from 'react'

interface AudioButtonProps {
  audioUrl?: string | null
  hanzi: string
  pinyin: string
  size?: 'sm' | 'md' | 'lg'
}

export default function AudioButton({ audioUrl, hanzi, pinyin, size = 'md' }: AudioButtonProps) {
  const [playing, setPlaying] = useState(false)
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null)

  const sizeClasses = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-lg' }

  const play = () => {
    if (playing) return
    setPlaying(true)

    if (audioUrl) {
      const audio = new Audio(audioUrl)
      audio.onended = () => setPlaying(false)
      audio.onerror = () => fallbackTTS()
      audio.play().catch(() => fallbackTTS())
    } else {
      fallbackTTS()
    }
  }

  const fallbackTTS = () => {
    if (synthRef.current) window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(hanzi)
    utterance.lang = 'zh-CN'
    utterance.rate = 0.8
    utterance.onend = () => setPlaying(false)
    utterance.onerror = () => setPlaying(false)
    synthRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }

  return (
    <button
      onClick={play}
      disabled={playing}
      className={`${sizeClasses[size]} rounded-full bg-[#2d2d44] hover:bg-[#7c3aed] transition-colors flex items-center justify-center disabled:opacity-50`}
      title={playing ? 'Reproduciendo...' : `Escuchar: ${pinyin}`}
    >
      {playing ? '🔊' : '🔇'}
    </button>
  )
}
