'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import MapCanvas from '@/components/ui/map-canvas'
import EmptyState from '@/components/ui/empty-state'
import LiliAvatar from '@/components/ui/lili-avatar'
import type { Mission, UserMission } from '@/types'
import type { MapNode } from '@/components/ui/map-canvas'

export default function MapPage() {
  const [nodes, setNodes] = useState<MapNode[]>([])
  const [playerLevel, setPlayerLevel] = useState(1)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadMap()
  }, [])

  const loadMap = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase.from('profiles').select('level').eq('id', user.id).single()
    if (profile) setPlayerLevel(profile.level)

    const { data: m } = await supabase.from('missions').select('*').order('order_index')
    const { data: um } = await supabase.from('user_missions').select('*').eq('user_id', user.id)

    if (m) {
      const completedIds = new Set(
        (um || []).filter(u => u.status === 'completed').map(u => u.mission_id)
      )

      const mapped: MapNode[] = m.map((mission, i) => {
        const prevCompleted = i === 0 || completedIds.has(m[i - 1].id)
        const levelUnlocked = profile ? profile.level >= mission.level_required : false
        const isUnlocked = prevCompleted && levelUnlocked

        const userMission = um?.find(u => u.mission_id === mission.id)

        let status: MapNode['status'] = 'locked'
        if (userMission?.status === 'completed') status = 'completed'
        else if (isUnlocked) status = 'unlocked'

        return {
          id: mission.id,
          bossId: mission.boss_id,
          name: mission.display_name,
          hp: mission.hp,
          timerSecs: mission.timer_secs,
          lives: mission.lives,
          status,
          highScore: userMission?.high_score || 0,
          x: 0,
          y: 0,
        }
      })

      setNodes(mapped)
    }
    setLoading(false)
  }

  const handleSelect = (bossId: string) => {
    router.push(`/mission/${bossId}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-4xl animate-pulse">🗺️</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#f59e0b]">🗺️ Mapa Mundial</h1>
          <p className="text-sm text-[#6b7280]">Nv.{playerLevel} — Derrota a los jefes para progresar</p>
        </div>
        <div className="flex items-center gap-2">
          <LiliAvatar expression="cool" size={36} />
        </div>
      </div>

      {nodes.length === 0 ? (
        <EmptyState lili="blanket" title="No hay misiones disponibles" />
      ) : (
        <MapCanvas
          nodes={nodes}
          playerLevel={playerLevel}
          onSelect={handleSelect}
        />
      )}
    </div>
  )
}
