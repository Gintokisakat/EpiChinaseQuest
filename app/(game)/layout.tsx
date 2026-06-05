'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { xpProgress, xpColor } from '@/lib/game/xp'

export default function GameLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, signOut } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f0f1a]">
        <div className="text-6xl animate-pulse">🏯</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f0f1a] p-4">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-[#f0e6d0] mb-2">Inicia sesión</h2>
          <a href="/login" className="text-[#f59e0b] hover:underline">Ir al login</a>
        </div>
      </div>
    )
  }

  const xp = profile ? xpProgress(profile.xp) : null

  return (
    <div className="min-h-screen bg-[#0f0f1a] flex flex-col">
      {/* Navbar */}
      <nav className="bg-[#1a1a2e] border-b border-[#2d2d44] px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-[#f0e6d0] hover:text-[#f59e0b] transition-colors text-xl"
          >
            ☰
          </button>
          <a href="/" className="text-lg font-bold text-[#f59e0b]">🏯 EpilChinaseQuest</a>
        </div>
        <div className="flex items-center gap-4">
          {xp && (
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <span className="text-[#a78bfa]">Nv.{xp.level}</span>
              <div className="w-24 h-2 bg-[#2d2d44] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${xp.progress * 100}%`, backgroundColor: xpColor(xp.level) }}
                />
              </div>
              <span className="text-[#6b7280]">{xp.currentXp}/{xp.nextLevelXp}</span>
            </div>
          )}
          {profile?.daily_streak ? (
            <span className="text-sm text-[#fbbf24]">🔥 {profile.daily_streak}</span>
          ) : null}
          <button
            onClick={signOut}
            className="text-sm text-[#6b7280] hover:text-[#ef4444] transition-colors"
          >
            Salir
          </button>
        </div>
      </nav>

      {/* Sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-[#1a1a2e] border-r border-[#2d2d44] z-50 transform transition-transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-[#2d2d44]">
          <div className="text-lg font-bold text-[#f59e0b] mb-2">Menú</div>
          {profile && (
            <div className="text-sm text-[#6b7280]">{profile.display_name || profile.username || user.email}</div>
          )}
        </div>
        <nav className="p-4 space-y-2">
          <a href="/" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#2d2d44] text-[#f0e6d0] transition-colors">
            <span>🏠</span> Inicio
          </a>
          <a href="/learn" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#2d2d44] text-[#7c3aed] transition-colors">
            <span>📖</span> Aprender
          </a>
          <a href="/review" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#2d2d44] text-[#f0e6d0] transition-colors">
            <span>📚</span> Repasar
          </a>
          <a href="/map" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#2d2d44] text-[#f0e6d0] transition-colors">
            <span>⚔️</span> Cruzada
          </a>
          <a href="/collection" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#2d2d44] text-[#f0e6d0] transition-colors">
            <span>🃏</span> Colección
          </a>
          <a href="/leaderboard" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#2d2d44] text-[#f0e6d0] transition-colors">
            <span>🏆</span> Ranking
          </a>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-4">{children}</main>
    </div>
  )
}
