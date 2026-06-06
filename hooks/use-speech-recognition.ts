'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

export type SpeechResult = 'correct' | 'partial' | 'wrong'

interface SpeechState {
  transcript: string
  isListening: boolean
  error: string | null
  supported: boolean
}

const CHINESE_NUMERALS: Record<string, string> = {
  '1': 'yi1', '2': 'er4', '3': 'san1', '4': 'si4', '5': 'wu3',
  '6': 'liu4', '7': 'qi1', '8': 'ba1', '9': 'jiu3', '10': 'shi2',
}

function normalize(str: string): string {
  return str
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\d/g, d => CHINESE_NUMERALS[d] || d)
    .trim()
}

function stripTones(str: string): string {
  return str.replace(/[āáǎà]/g, 'a')
    .replace(/[ēéěè]/g, 'e')
    .replace(/[īíǐì]/g, 'i')
    .replace(/[ōóǒò]/g, 'o')
    .replace(/[ūúǔù]/g, 'u')
    .replace(/[ǖǘǚǜ]/g, 'ü')
    .replace(/[1-4]/g, '')
    .trim()
}

export function compareAnswer(transcript: string, expected: string): SpeechResult {
  const normTranscript = normalize(transcript)
  const normExpected = normalize(expected)

  if (!normTranscript || !normExpected) return 'wrong'

  if (normTranscript === normExpected) return 'correct'

  const untoneTranscript = stripTones(normTranscript)
  const untoneExpected = stripTones(normExpected)

  if (untoneTranscript === untoneExpected) return 'correct'

  if (untoneTranscript.includes(untoneExpected) || untoneExpected.includes(untoneTranscript)) {
    return 'partial'
  }

  const tWords = untoneTranscript.split(' ')
  const eWords = untoneExpected.split(' ')
  const overlap = tWords.filter(w => eWords.includes(w)).length
  if (overlap > 0 && overlap >= eWords.length / 2) return 'partial'

  return 'wrong'
}

export function useSpeechRecognition() {
  const [state, setState] = useState<SpeechState>({
    transcript: '',
    isListening: false,
    error: null,
    supported: false,
  })

  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    setState(prev => ({ ...prev, supported: !!SpeechRecognition }))
  }, [])

  const start = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      setState(prev => ({ ...prev, error: 'Tu navegador no soporta reconocimiento de voz' }))
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'zh-CN'
    recognition.continuous = false
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setState(prev => ({ ...prev, transcript, isListening: false }))
    }

    recognition.onerror = (event: any) => {
      setState(prev => ({
        ...prev,
        error: event.error === 'no-speech' ? 'No se detectó voz' : `Error: ${event.error}`,
        isListening: false,
      }))
    }

    recognition.onend = () => {
      setState(prev => ({ ...prev, isListening: false }))
    }

    recognitionRef.current = recognition
    setState(prev => ({ ...prev, transcript: '', isListening: true, error: null }))
    recognition.start()
  }, [])

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setState(prev => ({ ...prev, isListening: false }))
  }, [])

  return { ...state, start, stop }
}
