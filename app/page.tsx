'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoading(false)
    })
  }, [supabase])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f0f1a]">
        <div className="text-6xl animate-pulse">🏯</div>
      </div>
    )
  }

  if (user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0f0f1a] p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">🏯</div>
          <h1 className="text-3xl font-bold text-[#f0e6d0] mb-2">
            EpilChinaseQuest
          </h1>
          <p className="text-[#a78bfa] mb-8">
            Bienvenido, {user.email}
          </p>
          <div className="grid grid-cols-2 gap-4">
            <a
              href="/map"
              className="bg-[#1a1a2e] border border-[#2d2d44] rounded-xl p-6 hover:border-[#f59e0b] transition-colors text-center"
            >
              <div className="text-3xl mb-2">🗺️</div>
              <div className="text-sm font-medium text-[#f0e6d0]">Mapa</div>
            </a>
            <a
              href="/review"
              className="bg-[#1a1a2e] border border-[#2d2d44] rounded-xl p-6 hover:border-[#f59e0b] transition-colors text-center"
            >
              <div className="text-3xl mb-2">📚</div>
              <div className="text-sm font-medium text-[#f0e6d0]">Repaso</div>
            </a>
            <a
              href="/collection"
              className="bg-[#1a1a2e] border border-[#2d2d44] rounded-xl p-6 hover:border-[#f59e0b] transition-colors text-center"
            >
              <div className="text-3xl mb-2">🃏</div>
              <div className="text-sm font-medium text-[#f0e6d0]">Colección</div>
            </a>
            <a
              href="/leaderboard"
              className="bg-[#1a1a2e] border border-[#2d2d44] rounded-xl p-6 hover:border-[#f59e0b] transition-colors text-center"
            >
              <div className="text-3xl mb-2">🏆</div>
              <div className="text-sm font-medium text-[#f0e6d0]">Ranking</div>
            </a>
          </div>
          <button
            onClick={() => supabase.auth.signOut()}
            className="mt-8 text-sm text-[#6b7280] hover:text-[#ef4444] transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    )
  }

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
          Domina 11,000 palabras HSK 3.0 · Derrota jefes épicos · Colecciona cartas · Sube de nivel
        </p>
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
        <div className="mt-16 grid grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-3xl mb-2">⚔️</div>
            <div className="text-xs text-[#6b7280]">10 Bosses</div>
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
