'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { xpProgress, xpColor } from '@/lib/game/xp'
import BottomNav from '@/components/ui/bottom-nav'
import LiliAvatar from '@/components/ui/lili-avatar'
import type { User } from '@supabase/supabase-js'
import type { Profile, Card, UserCard } from '@/types'

const DAILY_GOAL = 10

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [knownCount, setKnownCount] = useState(0)
  const [reviseCount, setReviseCount] = useState(0)
  const [lastCard, setLastCard] = useState<(Card & { userCard: UserCard }) | null>(null)
  const [todayCount, setTodayCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)

    if (user) {
      const { data: p } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setProfile(p)

      const { count: known } = await supabase
        .from('user_cards')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('known', true)
      setKnownCount(known || 0)

      const { count: revise } = await supabase
        .from('user_cards')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .or('revise1.eq.true,revise2.eq.true')
      setReviseCount(revise || 0)

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const { count: todayCards } = await supabase
        .from('user_cards')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('updated_at', today.toISOString())
      setTodayCount(todayCards || 0)

      const { data: last } = await supabase
        .from('user_cards')
        .select('id, card_id, known, revise1, revise2, card_level, challenge_streak, challenge_best, updated_at, cards(*)')
        .eq('user_id', user.id)
        .not('updated_at', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(1)
      if (last && last.length > 0) {
        const uc = last[0] as unknown as UserCard & { cards: Card }
        setLastCard({ ...uc.cards, userCard: { ...uc, card_id: uc.card_id, user_id: user.id } })
      }
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f0f1a]">
        <div className="text-6xl animate-pulse">🏯</div>
      </div>
    )
  }

  if (user && profile) {
    const xp = xpProgress(profile.xp)
    const dailyProgress = Math.min(todayCount / DAILY_GOAL, 1)

    return (
      <div className="min-h-screen bg-[#0f0f1a]">
        {/* Top bar */}
        <nav className="bg-[#1a1a2e] border-b border-[#2d2d44] px-4 py-2.5 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <LiliAvatar expression="uwu" size={32} />
            <span className="text-base font-bold text-[#f59e0b]">EpilChinaseQuest</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            {profile?.daily_streak ? (
              <span className="text-[#fbbf24]">🔥 {profile.daily_streak}</span>
            ) : null}
            {xp && (
              <span className="text-[#a78bfa]">Nv.{xp.level}</span>
            )}
            <button
              onClick={() => supabase.auth.signOut()}
              className="text-[#6b7280] hover:text-[#ef4444] transition-colors text-xs"
            >
              Salir
            </button>
          </div>
        </nav>

        <div className="max-w-lg mx-auto p-4 space-y-4 pb-20">
          {/* Lili + XP Bar */}
          <div className="bg-[#1a1a2e] border border-[#2d2d44] rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <LiliAvatar
                expression={reviseCount > 10 ? 'sweats' : knownCount > 0 ? 'happy' : 'uwu'}
                size={56}
              />
              <div className="flex-1">
                <div className="text-sm font-bold text-[#f0e6d0]">
                  {reviseCount > 10 ? '¡Hay mucho por repasar!' : knownCount > 0 ? 'Buen trabajo' : '¡Bienvenido!'}
                </div>
                <div className="text-xs text-[#6b7280]">Nivel {xp.level}</div>
              </div>
              <div className="text-right text-xs text-[#6b7280]">{xp.currentXp} / {xp.nextLevelXp} XP</div>
            </div>
            <div className="w-full h-2 bg-[#2d2d44] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${xp.progress * 100}%`, backgroundColor: xpColor(xp.level) }}
              />
            </div>
            <div className="flex justify-between text-xs text-[#6b7280] mt-2">
              <span>🃏 {knownCount} cartas</span>
              <span>📚 {reviseCount} pendientes</span>
            </div>
          </div>

          {/* Daily Mission */}
          <div className="bg-gradient-to-r from-[#f59e0b]/20 to-[#d97706]/20 border border-[#f59e0b]/30 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-[#f59e0b] text-sm">🎯 Misión Diaria</span>
              <span className="text-xs text-[#f59e0b]">{todayCount}/{DAILY_GOAL}</span>
            </div>
            <div className="text-xs text-[#f0e6d0]/80 mb-2">Estudia {DAILY_GOAL} cartas hoy</div>
            <div className="w-full h-2 bg-[#2d2d44] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-[#f59e0b] transition-all"
                style={{ width: `${dailyProgress * 100}%` }}
              />
            </div>
          </div>

          {/* Continue donde dejaste */}
          <div className="bg-[#1a1a2e] border border-[#2d2d44] rounded-xl p-4">
            <div className="text-sm font-bold text-[#f0e6d0] mb-2">▶️ Continuar</div>
            {lastCard && !lastCard.userCard.known ? (
              <a
                href="/review"
                className="flex items-center gap-3 bg-[#2d2d44] rounded-lg p-3 hover:bg-[#3d3d54] transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[#f0e6d0] truncate">{lastCard.hanzi} — {lastCard.pinyin}</div>
                  <div className="text-xs text-[#6b7280]">{lastCard.english}</div>
                </div>
                <span className="text-xs text-[#f59e0b]">Repasar →</span>
              </a>
            ) : reviseCount > 0 ? (
              <a href="/review" className="flex items-center gap-3 bg-[#059669]/20 rounded-lg p-3 hover:brightness-110 transition-colors">
                <div className="text-2xl">📚</div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-[#f0e6d0]">{reviseCount} cartas por repasar</div>
                  <div className="text-xs text-[#6b7280]">Continúa tu repaso</div>
                </div>
                <span className="text-xs text-[#059669]">Ir →</span>
              </a>
            ) : knownCount > 0 ? (
              <a href="/learn" className="flex items-center gap-3 bg-[#7c3aed]/20 rounded-lg p-3 hover:brightness-110 transition-colors">
                <div className="text-2xl">📖</div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-[#f0e6d0]">Aprende nuevas cartas</div>
                  <div className="text-xs text-[#6b7280]">Amplía tu vocabulario</div>
                </div>
                <span className="text-xs text-[#7c3aed]">Ir →</span>
              </a>
            ) : (
              <a href="/learn" className="flex items-center gap-3 bg-[#7c3aed]/20 rounded-lg p-3 hover:brightness-110 transition-colors">
                <div className="text-2xl">📖</div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-[#f0e6d0]">Empieza tu viaje</div>
                  <div className="text-xs text-[#6b7280]">Primera lección</div>
                </div>
                <span className="text-xs text-[#7c3aed]">Ir →</span>
              </a>
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <a href="/learn" className="bg-gradient-to-br from-[#7c3aed] to-[#6d28d9] rounded-xl p-4 hover:brightness-110 transition-all">
              <div className="text-2xl mb-1">📖</div>
              <div className="font-bold text-white text-sm">Aprender</div>
            </a>
            <a href="/review" className="bg-gradient-to-br from-[#059669] to-[#047857] rounded-xl p-4 hover:brightness-110 transition-all">
              <div className="text-2xl mb-1">📚</div>
              <div className="font-bold text-white text-sm">Repasar</div>
              {reviseCount > 0 && <div className="text-xs text-white/80">{reviseCount} pendientes</div>}
            </a>
            <a href="/map" className="bg-gradient-to-br from-[#dc2626] to-[#b91c1c] rounded-xl p-4 hover:brightness-110 transition-all">
              <div className="text-2xl mb-1">⚔️</div>
              <div className="font-bold text-white text-sm">Cruzada</div>
            </a>
            <a href="/shop" className="bg-gradient-to-br from-[#f59e0b] to-[#d97706] rounded-xl p-4 hover:brightness-110 transition-all">
              <div className="text-2xl mb-1">🏪</div>
              <div className="font-bold text-white text-sm">Tienda</div>
            </a>
            <a href="/collection" className="bg-gradient-to-br from-[#d97706] to-[#b45309] rounded-xl p-4 hover:brightness-110 transition-all">
              <div className="text-2xl mb-1">🃏</div>
              <div className="font-bold text-white text-sm">Colección</div>
              <div className="text-xs text-white/80">{knownCount} cartas</div>
            </a>
            <a href="/leaderboard" className="bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] rounded-xl p-4 hover:brightness-110 transition-all">
              <div className="text-2xl mb-1">🏆</div>
              <div className="font-bold text-white text-sm">Ranking</div>
            </a>
          </div>
        </div>

        <BottomNav />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0f0f1a] p-4">
      <div className="text-center max-w-lg">
        <div className="mb-6 flex justify-center">
          <LiliAvatar expression="uwu" size={120} />
        </div>
        <h1 className="text-4xl font-bold text-[#f59e0b] mb-2">
          EpilChinaseQuest
        </h1>
        <p className="text-xl text-[#a78bfa] mb-2">
          Aprende chino mientras salvas el mundo
        </p>
        <p className="text-sm text-[#6b7280] mb-10">
          11,000 palabras HSK 3.0 · Derrota jefes · Colecciona cartas · Sube de nivel
        </p>

        <div className="grid grid-cols-3 gap-4 mb-10 text-center">
          <div className="bg-[#1a1a2e] border border-[#2d2d44] rounded-xl p-4">
            <div className="text-3xl mb-2">📖</div>
            <div className="text-xs text-[#6b7280]">1. Aprende</div>
          </div>
          <div className="bg-[#1a1a2e] border border-[#2d2d44] rounded-xl p-4">
            <div className="text-3xl mb-2">⚔️</div>
            <div className="text-xs text-[#6b7280]">2. Enfréntate</div>
          </div>
          <div className="bg-[#1a1a2e] border border-[#2d2d44] rounded-xl p-4">
            <div className="text-3xl mb-2">🃏</div>
            <div className="text-xs text-[#6b7280]">3. Colecciona</div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/login"
            className="bg-[#f59e0b] text-black font-bold px-8 py-3 rounded-xl hover:bg-[#d97706] transition-colors"
          >
            Comenzar Aventura
          </a>
          <a
            href="/login?signup=true"
            className="bg-[#1a1a2e] border border-[#2d2d44] text-[#f0e6d0] font-bold px-8 py-3 rounded-xl hover:border-[#f59e0b] transition-colors"
          >
            Crear Cuenta
          </a>
        </div>

        <div className="mt-10 grid grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-3xl mb-2">⚔️</div>
            <div className="text-xs text-[#6b7280]">10 Jefes</div>
          </div>
          <div>
            <div className="text-3xl mb-2">🃏</div>
            <div className="text-xs text-[#6b7280]">11,000 Cartas</div>
          </div>
          <div>
            <div className="text-3xl mb-2">🐉</div>
            <div className="text-xs text-[#6b7280]">16 Personajes</div>
          </div>
        </div>
      </div>
    </div>
  )
}
