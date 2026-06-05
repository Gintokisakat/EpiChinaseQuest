'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { xpProgress, xpColor } from '@/lib/game/xp'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [knownCount, setKnownCount] = useState(0)
  const [reviseCount, setReviseCount] = useState(0)
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

    return (
      <div className="min-h-screen bg-[#0f0f1a]">
        {/* Header */}
        <div className="bg-[#1a1a2e] border-b border-[#2d2d44] px-4 py-3 flex items-center justify-between">
          <span className="text-lg font-bold text-[#f59e0b]">🏯 EpilChinaseQuest</span>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-[#fbbf24]">🔥 {profile.daily_streak}</span>
            <span className="text-[#a78bfa]">Nv.{xp.level}</span>
            <button
              onClick={() => supabase.auth.signOut()}
              className="text-[#6b7280] hover:text-[#ef4444] transition-colors"
            >
              Salir
            </button>
          </div>
        </div>

        <div className="max-w-lg mx-auto p-4">
          {/* XP Bar */}
          <div className="bg-[#1a1a2e] border border-[#2d2d44] rounded-xl p-4 mb-6">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-[#a78bfa]">Nivel {xp.level}</span>
              <span className="text-[#6b7280]">{xp.currentXp} / {xp.nextLevelXp} XP</span>
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

          {/* FLOW DE APRENDIZAJE */}
          <div className="space-y-3">
            {/* Paso 1: Aprender */}
            <a
              href="/learn"
              className="block bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] rounded-xl p-5 hover:brightness-110 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="text-3xl">📖</div>
                <div>
                  <div className="font-bold text-white text-lg">1. Aprender</div>
                  <div className="text-sm text-white/80">
                    Estudia unidades nuevas de vocabulario
                  </div>
                </div>
                <div className="ml-auto text-2xl">→</div>
              </div>
            </a>

            {/* Paso 2: Repasar */}
            <a
              href="/review"
              className="block bg-gradient-to-r from-[#059669] to-[#047857] rounded-xl p-5 hover:brightness-110 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="text-3xl">📚</div>
                <div>
                  <div className="font-bold text-white text-lg">2. Repasar</div>
                  <div className="text-sm text-white/80">
                    Refuerza cartas {reviseCount > 0 ? `(${reviseCount} pendientes)` : ''}
                  </div>
                </div>
                <div className="ml-auto text-2xl">→</div>
              </div>
            </a>

            {/* Paso 3: Cruzada (Bosses) */}
            <a
              href="/map"
              className="block bg-gradient-to-r from-[#dc2626] to-[#b91c1c] rounded-xl p-5 hover:brightness-110 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="text-3xl">⚔️</div>
                <div>
                  <div className="font-bold text-white text-lg">3. Cruzada</div>
                  <div className="text-sm text-white/80">
                    Derrota jefes con tu conocimiento
                  </div>
                </div>
                <div className="ml-auto text-2xl">→</div>
              </div>
            </a>

            {/* Colección */}
            <a
              href="/collection"
              className="block bg-gradient-to-r from-[#d97706] to-[#b45309] rounded-xl p-5 hover:brightness-110 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="text-3xl">🃏</div>
                <div>
                  <div className="font-bold text-white text-lg">Colección</div>
                  <div className="text-sm text-white/80">
                    {knownCount} cartas coleccionadas
                  </div>
                </div>
                <div className="ml-auto text-2xl">→</div>
              </div>
            </a>

            {/* Leaderboard */}
            <a
              href="/leaderboard"
              className="block bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] rounded-xl p-5 hover:brightness-110 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="text-3xl">🏆</div>
                <div>
                  <div className="font-bold text-white text-lg">Ranking</div>
                  <div className="text-sm text-white/80">
                    Compara tu progreso con otros jugadores
                  </div>
                </div>
                <div className="ml-auto text-2xl">→</div>
              </div>
            </a>
          </div>
        </div>
      </div>
    )
  }

  // Landing page for non-logged-in users
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0f0f1a] p-4">
      <div className="text-center max-w-lg">
        <div className="text-7xl mb-6">🏯</div>
        <h1 className="text-4xl font-bold text-[#f59e0b] mb-2">
          EpilChinaseQuest
        </h1>
        <p className="text-xl text-[#a78bfa] mb-2">
          Aprende chino mientras salvas el mundo
        </p>
        <p className="text-sm text-[#6b7280] mb-10">
          11,000 palabras HSK 3.0 · Derrota jefes · Colecciona cartas · Sube de nivel
        </p>

        {/* Flow explanation */}
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
