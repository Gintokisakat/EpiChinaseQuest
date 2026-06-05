'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Mission, UserMission } from '@/types'

const LEVEL_INFO = [
  { level: 1, name: 'Nivel 1', cards: 300, emoji: '🌱', unlocked: true },
  { level: 2, name: 'Nivel 2', cards: 200, emoji: '🌿' },
  { level: 3, name: 'Nivel 3', cards: 500, emoji: '🌳' },
  { level: 4, name: 'Nivel 4', cards: 1000, emoji: '🏔️' },
  { level: 5, name: 'Nivel 5', cards: 1600, emoji: '⛰️' },
  { level: 6, name: 'Nivel 6', cards: 1800, emoji: '🏯' },
  { level: 7, name: 'Nivel 7', cards: 5600, emoji: '🐉' },
]

export default function MapPage() {
  const [missions, setMissions] = useState<(Mission & { userMission?: UserMission })[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadMap()
  }, [])

  const loadMap = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: m } = await supabase.from('missions').select('*').order('order_index')
    const { data: um } = await supabase.from('user_missions').select('*').eq('user_id', user.id)

    if (m) {
      const mapped = m.map(mission => ({
        ...mission,
        userMission: um?.find(u => u.mission_id === mission.id) as UserMission | undefined,
      })) as (Mission & { userMission?: UserMission })[]
      setMissions(mapped)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-4xl animate-pulse">🗺️</div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-[#f59e0b]">🗺️ Mapa Mundial</h1>
        <p className="text-sm text-[#6b7280]">Progresa a través de los niveles y derrota a los jefes</p>
      </div>

      {/* Level progress */}
      <div className="grid grid-cols-7 gap-2 mb-8">
        {LEVEL_INFO.map(l => (
          <div key={l.level} className="text-center">
            <div className="text-2xl mb-1">{l.emoji}</div>
            <div className="text-xs text-[#6b7280]">{l.name}</div>
            <div className="text-xs text-[#4b5563]">{l.cards}</div>
          </div>
        ))}
      </div>

      {/* Mission list */}
      <div className="space-y-3">
        {missions.map(m => {
          const status = m.userMission?.status || 'locked'
          const isCompleted = status === 'completed'

          return (
            <a
              key={m.id}
              href={status !== 'locked' ? `/mission/${m.boss_id}` : undefined}
              className={`block bg-[#1a1a2e] border rounded-xl p-4 transition-colors ${
                isCompleted
                  ? 'border-[#34d399] opacity-80'
                  : status === 'locked'
                  ? 'border-[#2d2d44] opacity-50 cursor-not-allowed'
                  : 'border-[#2d2d44] hover:border-[#f59e0b]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {isCompleted ? '✅' : status === 'locked' ? '🔒' : '⚔️'}
                  </span>
                  <div>
                    <div className="font-bold text-[#f0e6d0]">{m.display_name}</div>
                    <div className="text-xs text-[#6b7280]">
                      {m.hp.toLocaleString()} HP · {Math.floor(m.timer_secs / 60)} min
                      {isCompleted && m.userMission?.high_score ? ` · Best: ${m.userMission.high_score} pts` : ''}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-[#6b7280]">{m.lives} ❤️</div>
                  {isCompleted && <div className="text-xs text-[#34d399]">Completado</div>}
                </div>
              </div>
            </a>
          )
        })}
      </div>
    </div>
  )
}
