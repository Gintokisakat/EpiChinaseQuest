'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

const tabs = [
  { href: '/', label: 'Inicio', icon: '🏠' },
  { href: '/sprint', label: 'Veloz', icon: '⚡' },
  { href: '/learn', label: 'Aprender', icon: '📖' },
  { href: '/map', label: 'Cruzada', icon: '⚔️' },
  { href: '/shop', label: 'Tienda', icon: '🏪' },
  { href: '/collection', label: 'Colección', icon: '🃏' },
  { href: '/leaderboard', label: 'Ranking', icon: '🏆' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#1a1a2e] border-t border-[#2d2d44] safe-area-bottom">
      <div className="flex items-center justify-around max-w-2xl mx-auto px-2">
        {tabs.map(tab => {
          const isActive = pathname === tab.href
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center py-2 px-1.5 min-w-[48px] transition-colors ${
                isActive
                  ? 'text-[#f59e0b]'
                  : 'text-[#6b7280] hover:text-[#f0e6d0]'
              }`}
            >
              <span className="text-xl sm:text-base">{tab.icon}</span>
              <span className="text-[10px] sm:text-xs mt-0.5 font-medium">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
