'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import EmptyState from '@/components/ui/empty-state'
import type { Card, UserCard } from '@/types'

export default function CollectionPage() {
  const [knownCards, setKnownCards] = useState<(Card & { userCard: UserCard })[]>([])
  const [characters, setCharacters] = useState<{ id: string; name: string; emoji: string; rarity: string; equipped: boolean }[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'cards' | 'characters'>('cards')
  const [search, setSearch] = useState('')
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Fetch user_cards and cards separately to avoid join issues
    const { data: uc } = await supabase
      .from('user_cards')
      .select('*')
      .eq('user_id', user.id)
      .eq('known', true)
      .order('card_level', { ascending: false })

    if (uc && uc.length > 0) {
      const cardIds = uc.map(u => u.card_id)
      const { data: cards } = await supabase
        .from('cards')
        .select('*')
        .in('id', cardIds)

      const cardMap = new Map((cards || []).map(c => [c.id, c]))
      setKnownCards(
        uc.map(u => ({ ...cardMap.get(u.card_id), userCard: u } as Card & { userCard: UserCard }))
          .filter(c => c.hanzi != null)
      )
    }

    const { data: chars } = await supabase
      .from('user_characters')
      .select('*, character:character_id(*)')
      .eq('user_id', user.id)

    if (chars) {
      setCharacters(chars.map((c: Record<string, unknown>) => ({
        id: (c.character as { id: string }).id,
        name: (c.character as { name: string }).name,
        emoji: (c.character as { emoji: string }).emoji,
        rarity: (c.character as { rarity: string }).rarity,
        equipped: c.is_equipped as boolean,
      })))
    }
    setLoading(false)
  }

  const toggleEquip = async (charId: string, currentlyEquipped: boolean) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('user_characters')
      .update({ is_equipped: !currentlyEquipped })
      .eq('user_id', user.id)
      .eq('character_id', charId)

    setCharacters(prev => prev.map(c =>
      c.id === charId ? { ...c, equipped: !currentlyEquipped } : c
    ))
  }

  const filteredCards = knownCards.filter(c =>
    c.hanzi?.includes(search) || c.pinyin?.includes(search) || c.english?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-4xl animate-pulse">🃏</div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-[#f59e0b]">🃏 Colección</h1>
        <p className="text-sm text-[#6b7280]">{knownCards.length} cartas coleccionadas</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 justify-center">
        <button
          onClick={() => setTab('cards')}
          className={`px-4 py-2 rounded-lg text-sm transition-colors ${tab === 'cards' ? 'bg-[#f59e0b] text-black' : 'bg-[#1a1a2e] text-[#f0e6d0] border border-[#2d2d44]'}`}
        >
          Cartas ({knownCards.length})
        </button>
        <button
          onClick={() => setTab('characters')}
          className={`px-4 py-2 rounded-lg text-sm transition-colors ${tab === 'characters' ? 'bg-[#f59e0b] text-black' : 'bg-[#1a1a2e] text-[#f0e6d0] border border-[#2d2d44]'}`}
        >
          Personajes ({characters.length})
        </button>
      </div>

      {tab === 'cards' && (
        <>
          <input
            type="text"
            placeholder="Buscar hanzi, pinyin o significado..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-4 py-2 bg-[#1a1a2e] border border-[#2d2d44] rounded-xl text-[#f0e6d0] placeholder:text-[#6b7280] focus:outline-none focus:border-[#f59e0b] mb-4"
          />

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredCards.map(({ hanzi, pinyin, english, level, userCard }) => (
              <div
                key={userCard.id}
                className="bg-[#1a1a2e] border border-[#2d2d44] rounded-xl p-4 text-center hover:border-[#f59e0b] transition-colors"
              >
                <div className="text-2xl font-bold text-[#f0e6d0] mb-1">{hanzi}</div>
                <div className="text-xs text-[#a78bfa] mb-1">{pinyin}</div>
                <div className="text-xs text-[#6b7280] mb-2 truncate">{english.split(';')[0]}</div>
                <div className="flex items-center justify-center gap-2 text-xs">
                  <span className="bg-[#2d2d44] px-2 py-0.5 rounded text-[#f0e6d0]">Lv.{userCard.card_level}</span>
                  <span className="bg-[#2d2d44] px-2 py-0.5 rounded text-[#6b7280]">L{level}</span>
                </div>
              </div>
            ))}
          </div>

          {filteredCards.length === 0 && (
            <div className="text-center py-10 text-[#6b7280]">
              {search ? 'Sin resultados' : 'Aún no has coleccionado cartas. ¡Estudia en el repaso!'}
            </div>
          )}
        </>
      )}

      {tab === 'characters' && (
        characters.length === 0 ? (
          <EmptyState lili="crysmile" title="Sin personajes" description="Los personajes se obtienen al subir de nivel y completar misiones." />
        ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {characters.map(char => (
            <div
              key={char.id}
              className={`bg-[#1a1a2e] border rounded-xl p-4 text-center transition-colors ${
                char.equipped ? 'border-[#f59e0b]' : 'border-[#2d2d44]'
              }`}
            >
              <div className="text-4xl mb-2">{char.emoji}</div>
              <div className="font-bold text-[#f0e6d0] text-sm mb-1">{char.name}</div>
              <div className="text-xs text-[#6b7280] mb-2">
                {char.rarity === 'legendary' ? '⭐' : char.rarity === 'epic' ? '⭐' : char.rarity === 'mythic' ? '⭐⭐' : ''}
                {char.rarity}
              </div>
              <button
                onClick={() => toggleEquip(char.id, char.equipped)}
                className={`text-xs px-3 py-1 rounded-lg transition-colors ${
                  char.equipped
                    ? 'bg-[#f59e0b] text-black'
                    : 'bg-[#2d2d44] text-[#6b7280] hover:text-[#f0e6d0]'
                }`}
              >
                {char.equipped ? 'Equipado' : 'Equipar'}
              </button>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
