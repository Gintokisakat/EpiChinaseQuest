# 🏯 EpilChinaseQuest

Aprende chino mandarín mientras derrotas jefes épicos, coleccionas cartas y subes de nivel.

**Stack**: Next.js 16 + TypeScript + Tailwind v4 + Supabase  
**Contenido**: 11,000 palabras HSK 3.0 con audio  
**Inspiración**: MacaLaoshi Flashcards

## Setup

1. Crea proyecto en [supabase.com](https://supabase.com)
2. Copia `.env.local.example` a `.env.local` y completa las credenciales
3. Pega `supabase/schema.sql` en el SQL Editor de Supabase y ejecútalo
4. Pega `supabase/rpc-add-xp.sql`, `seed-characters.sql`, `seed-missions.sql`, `seed-upgrades.sql`
5. `npm run import:cards` — importa 11,000 cards
6. `npm run import:audio` — sube 7,858 audios
7. `npm run dev` — 🚀

## Scripts

- `npm run dev` — desarrollo
- `npm run build` — build producción
- `npm run import:cards` — importar cards desde `/tmp/hsk30/cards.json`
- `npm run import:audio` — subir audios a Supabase Storage
