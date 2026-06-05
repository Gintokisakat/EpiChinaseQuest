'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'
import { xpProgress, xpColor } from '@/lib/game/xp'
import type { Profile, Upgrade, UserUpgrade } from '@/types'

export default function ShopPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [upgrades, setUpgrades] = useState<(Upgrade & { userLevel?: number })[]>([])
  const [loading, setLoading] = useState(true)
  const [buying, setBuying] = useState<string | null>(null)
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    loadShop()
  }, [])

  const loadShop = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: p } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    setProfile(p)

    const { data: allUpgrades } = await supabase
      .from('upgrades')
      .select('*')
      .order('cost', { ascending: true })
    if (!allUpgrades) { setLoading(false); return }

    const { data: owned } = await supabase
      .from('user_upgrades')
      .select('upgrade_id, level')
      .eq('user_id', user.id)

    const ownedMap = new Map((owned || []).map(u => [u.upgrade_id, (u as UserUpgrade).level]))

    setUpgrades(allUpgrades.map(u => ({
      ...u,
      userLevel: ownedMap.get(u.id) || 0,
    })))

    setLoading(false)
  }

  const buy = async (upgrade: Upgrade) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setBuying(upgrade.id)

    const currentLevel = upgrades.find(u => u.id === upgrade.id)?.userLevel || 0
    const cost = upgrade.cost * (currentLevel + 1)

    if ((profile?.xp || 0) < cost) {
      toast(`❌ No tienes suficiente XP. Necesitas ${cost} XP`, 'error')
      setBuying(null)
      return
    }

    const { error } = await supabase.rpc('buy_upgrade', {
      user_id: user.id,
      upgrade_id: upgrade.id,
    })

    if (error) {
      toast('Error al comprar mejora', 'error')
    } else {
      toast(`✅ ${upgrade.name} nivel ${currentLevel + 1} adquirida`, 'success')

      const { data: newP } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      if (newP) setProfile(newP)

      setUpgrades(prev => prev.map(u =>
        u.id === upgrade.id ? { ...u, userLevel: (u.userLevel || 0) + 1 } : u
      ))
    }

    setBuying(null)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-6xl animate-pulse">🏪</div>
      </div>
    )
  }

  const xp = profile ? xpProgress(profile.xp) : null

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#f0e6d0]">🏪 Tienda de Mejoras</h1>
        {xp && (
          <div className="text-sm text-[#a78bfa]">
            {xp.currentXp} / {xp.nextLevelXp} XP
          </div>
        )}
      </div>

      {xp && (
        <div className="bg-[#1a1a2e] border border-[#2d2d44] rounded-xl p-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-[#a78bfa]">Nv.{xp.level}</span>
            <span className="text-[#6b7280]">{profile?.xp || 0} XP disponibles</span>
          </div>
          <div className="w-full h-1.5 bg-[#2d2d44] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${xp.progress * 100}%`, backgroundColor: xpColor(xp.level) }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        {upgrades.map(upgrade => {
          const currentLevel = upgrade.userLevel || 0
          const cost = upgrade.cost * (currentLevel + 1)
          const canAfford = (profile?.xp || 0) >= cost

          return (
            <div
              key={upgrade.id}
              className={`bg-[#1a1a2e] border rounded-xl p-4 transition-all ${
                canAfford ? 'border-[#2d2d44] hover:border-[#f59e0b]/50' : 'border-[#2d2d44]/50 opacity-60'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl mt-0.5">{upgrade.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#f0e6d0] text-sm">{upgrade.name}</span>
                    {currentLevel > 0 && (
                      <span className="text-xs bg-[#f59e0b]/20 text-[#f59e0b] px-1.5 py-0.5 rounded">
                        Nv.{currentLevel}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[#6b7280] mt-0.5">{upgrade.description}</div>
                </div>
                <button
                  onClick={() => buy(upgrade)}
                  disabled={buying === upgrade.id || !canAfford}
                  className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                    buying === upgrade.id
                      ? 'bg-[#2d2d44] text-[#6b7280]'
                      : canAfford
                        ? 'bg-[#f59e0b] text-black hover:bg-[#d97706]'
                        : 'bg-[#2d2d44] text-[#6b7280] cursor-not-allowed'
                  }`}
                >
                  {buying === upgrade.id ? '...' : `${cost} XP`}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {upgrades.length === 0 && (
        <div className="text-center py-10 text-[#6b7280] text-sm">
          No hay mejoras disponibles en este momento.
        </div>
      )}
    </div>
  )
}
