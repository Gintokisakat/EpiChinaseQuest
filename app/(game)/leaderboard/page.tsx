'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import EmptyState from '@/components/ui/empty-state'

interface LeaderboardEntry {
  id: string
  display_name: string | null
  level: number
  xp: number
  daily_streak: number
  score: number
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [myScore, setMyScore] = useState<LeaderboardEntry | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadLeaderboard()
  }, [])

  const loadLeaderboard = async () => {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .order('level', { ascending: false })
      .limit(50)

    if (profiles) {
      const { data: { user } } = await supabase.auth.getUser()

      const mapped = profiles.map(p => {
        const knownScore = 0
        const score = Math.round(
          (knownScore + p.xp) * (1 + (p.daily_streak || 0) / 100) * (1 + p.level * 0.05)
        )
        return {
          id: p.id,
          display_name: p.display_name,
          level: p.level,
          xp: p.xp,
          daily_streak: p.daily_streak || 0,
          score,
        }
      })

      mapped.sort((a, b) => b.score - a.score)
      setEntries(mapped)

      if (user) {
        const me = mapped.find(e => e.id === user.id)
        if (me) setMyScore(me)
      }
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-4xl animate-pulse">🏆</div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-[#f59e0b]">🏆 Leaderboard</h1>
        <p className="text-sm text-[#6b7280]">Ranking global de jugadores</p>
      </div>

      {/* My score */}
      {myScore && (
        <div className="bg-[#1a1a2e] border border-[#f59e0b] rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-[#f59e0b]">#{entries.findIndex(e => e.id === myScore.id) + 1}</span>
              <div>
                <div className="font-bold text-[#f0e6d0]">{myScore.display_name || 'Tú'}</div>
                <div className="text-xs text-[#6b7280]">Nv.{myScore.level} · {myScore.xp} XP</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-[#f0e6d0]">{myScore.score.toLocaleString()}</div>
              {myScore.daily_streak > 0 && <div className="text-xs text-[#fbbf24]">🔥 {myScore.daily_streak}</div>}
            </div>
          </div>
        </div>
      )}

      {/* Rankings */}
      {entries.length === 0 ? (
        <EmptyState lili="sad" title="Sin rankings aún" description="Sé el primero en aparecer aquí estudiando y ganando XP." />
      ) : (
      <div className="space-y-2">
        {entries.map((entry, i) => (
          <div
            key={entry.id}
            className={`bg-[#1a1a2e] border border-[#2d2d44] rounded-xl p-3 ${
              myScore?.id === entry.id ? 'border-[#f59e0b]' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`w-6 text-center font-bold ${
                  i === 0 ? 'text-[#fbbf24]' : i === 1 ? 'text-[#94a3b8]' : i === 2 ? 'text-[#d97706]' : 'text-[#6b7280]'
                }`}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                </span>
                <div>
                  <div className="font-medium text-[#f0e6d0] text-sm">{entry.display_name || 'Anónimo'}</div>
                  <div className="text-xs text-[#6b7280]">Nv.{entry.level}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-[#f0e6d0]">{entry.score.toLocaleString()}</div>
                {entry.daily_streak > 0 && <div className="text-xs text-[#fbbf24]">🔥 {entry.daily_streak}</div>}
              </div>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  )
}
