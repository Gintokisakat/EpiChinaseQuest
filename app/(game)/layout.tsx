'use client'

import { useAuth } from '@/hooks/useAuth'
import { xpProgress, xpColor } from '@/lib/game/xp'
import BottomNav from '@/components/ui/bottom-nav'

export default function GameLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, signOut } = useAuth()

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
      {/* Top bar */}
      <nav className="bg-[#1a1a2e] border-b border-[#2d2d44] px-4 py-2.5 flex items-center justify-between sticky top-0 z-50">
        <a href="/" className="text-base font-bold text-[#f59e0b]">🏯 EpilChinaseQuest</a>
        <div className="flex items-center gap-3 text-sm">
          {profile?.daily_streak ? (
            <span className="text-[#fbbf24]">🔥 {profile.daily_streak}</span>
          ) : null}
          {xp && (
            <span className="text-[#a78bfa]">Nv.{xp.level}</span>
          )}
          <button
            onClick={signOut}
            className="text-[#6b7280] hover:text-[#ef4444] transition-colors text-xs"
          >
            Salir
          </button>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 p-4 pb-20">{children}</main>

      {/* Bottom nav */}
      <BottomNav />
    </div>
  )
}
