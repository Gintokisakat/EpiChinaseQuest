'use client'

import { useCallback, useState, useEffect, useRef } from 'react'
import { useSpeechRecognition, compareAnswer, type SpeechResult } from '@/hooks/use-speech-recognition'

interface Props {
  expectedAnswer: string
  onResult: (result: SpeechResult, transcript: string) => void
  disabled?: boolean
}

export default function AudioInput({ expectedAnswer, onResult, disabled }: Props) {
  const { transcript, isListening, error, supported, start, stop } = useSpeechRecognition()
  const [feedback, setFeedback] = useState<SpeechResult | null>(null)
  const [showTranscript, setShowTranscript] = useState('')
  const processedRef = useRef(false)

  const handleToggle = useCallback(() => {
    if (isListening) {
      stop()
      return
    }
    setFeedback(null)
    setShowTranscript('')
    processedRef.current = false
    start()
  }, [isListening, stop, start])

  useEffect(() => {
    if (!transcript || processedRef.current) return
    processedRef.current = true
    setShowTranscript(transcript)
    const result = compareAnswer(transcript, expectedAnswer)
    setFeedback(result)
    onResult(result, transcript)
  }, [transcript, expectedAnswer, onResult])

  const feedbackColor = feedback === 'correct' ? 'text-[#34d399]'
    : feedback === 'partial' ? 'text-[#f59e0b]'
    : feedback === 'wrong' ? 'text-[#ef4444]'
    : ''

  const feedbackText = feedback === 'correct' ? '¡Correcto! 🟢'
    : feedback === 'partial' ? 'Casi 🟡'
    : feedback === 'wrong' ? 'Incorrecto 🔴'
    : ''

  if (!supported) {
    return (
      <div className="text-sm text-[#6b7280] text-center">
        Tu navegador no soporta reconocimiento de voz
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={handleToggle}
        disabled={disabled || !!feedback}
        className={`
          w-20 h-20 rounded-full flex items-center justify-center text-3xl
          transition-all duration-200 select-none
          ${isListening
            ? 'bg-[#ef4444] text-white scale-110 shadow-lg shadow-[#ef4444]/40'
            : feedback
            ? feedback === 'correct' ? 'bg-[#34d399] text-white'
              : feedback === 'partial' ? 'bg-[#f59e0b] text-black'
              : 'bg-[#ef4444] text-white'
            : 'bg-[#1a1a2e] border-2 border-[#2d2d44] text-[#f0e6d0] hover:border-[#f59e0b]'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        {isListening ? (
          <span className="animate-pulse">🎤</span>
        ) : feedback === 'correct' ? (
          <span>✓</span>
        ) : feedback === 'partial' ? (
          <span>~</span>
        ) : feedback === 'wrong' ? (
          <span>✗</span>
        ) : (
          <span>🎤</span>
        )}
      </button>

      {isListening && (
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-[#ef4444] animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      )}

      {isListening && (
        <p className="text-sm text-[#6b7280]">Escuchando...</p>
      )}

      {error && !transcript && (
        <p className="text-sm text-[#ef4444]">{error}</p>
      )}

      {showTranscript && (
        <p className="text-sm text-[#f0e6d0] bg-[#0f0f1a] px-4 py-2 rounded-xl border border-[#2d2d44]">
          Dijiste: <span className="font-bold">{showTranscript}</span>
        </p>
      )}

      {feedback && (
        <p className={`text-lg font-bold ${feedbackColor}`}>
          {feedbackText}
        </p>
      )}
    </div>
  )
}
