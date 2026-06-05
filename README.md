# 🏯 EpilChinaseQuest

**Aprende chino mandarín mientras derrotas jefes épicos, coleccionas cartas y subes de nivel.**

Un RPG educativo gratuito con 11,000 palabras HSK 3.0, sistema SRS, jefes con power-ups, y personajes coleccionables. Inspirado en MacaLaoshi Flashcards.

🌐 **App**: [epi-chinase-quest.vercel.app](https://epi-chinase-quest.vercel.app)

---

## 🎮 Features

### 📖 Aprender
Estudia por unidades (L1-L7). Flashcards con hanzi → pinyin → significado. Mini quiz al final de cada unidad.

### 📚 Repaso (SRS)
Sistema de 3 cajas (known → revise1 → revise2). 3 modos de quiz: pinyin, significado, hanzi. Las cartas suben de nivel con cada acierto.

### ⚔️ Cruzada (Boss Fights)
10 jefes con HP, timer, vidas y power-ups que aparecen cada 5 aciertos. 14 tipos de power-ups (daño, tiempo, vida, combinados). Progresión lineal: cada jefe vencido desbloquea el siguiente.

### 🃏 Colección
Cartas conocidas con nivel, búsqueda por hanzi/pinyin/significado. Personajes equipables con rarezas (common → mythic).

### 🏆 Ranking Global
Puntuación compuesta: XP + nivel + racha diaria + cartas coleccionadas.

### 🗺️ Mapa Mundial
Progresión visual por niveles. Auto-destrebe por nivel del jugador + misión anterior completada.

---

## 🛠️ Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16 (App Router) |
| Lenguaje | TypeScript |
| Estilos | Tailwind CSS v4 |
| Base de datos | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email/password) |
| Storage | Supabase Storage (audio MP3) |
| Hosting | Vercel |
| Animaciones | Framer Motion |

---

## 📦 Contenido

- **11,000 cartas** — Vocabulario completo HSK 3.0 (L1-L7)
- **7,845 audios** — Pronunciación nativa en Supabase Storage
- **16 personajes** — Coleccionables con 4 rarezas
- **10 jefes** — Con pools de cartas, timer y HP escalado
- **14 power-ups** — Categorías: daño, tiempo, sacrificio, combinados
- **10 mejoras globales** — Tienda de upgrades permanentes
- **7 skins de Lili** — Desbloqueables por nivel

---

## 🚀 Setup Local

```bash
# 1. Clonar
git clone https://github.com/Gintokisakat/EpiChinaseQuest.git
cd EpiChinaseQuest

# 2. Instalar dependencias
npm install

# 3. Configurar Supabase
#    - Crear proyecto en supabase.com
#    - Copiar .env.local.example → .env.local
#    - Pegar supabase/schema.sql en SQL Editor
#    - Pegar supabase/rpc-add-xp.sql
#    - Pegar supabase/seed-characters.sql
#    - Pegar supabase/seed-missions.sql
#    - Pegar supabase/seed-upgrades.sql

# 4. Importar datos
npm run import:cards     # 11,000 cartas HSK 3.0
npm run import:audio     # 7,845 audios (opcional)

# 5. Iniciar
npm run dev
# → http://localhost:3000
```

---

## 📋 Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Desarrollo con Turbopack |
| `npm run build` | Build producción |
| `npm run import:cards` | Importar cards desde `/tmp/hsk30/cards.json` |
| `npm run import:audio` | Subir audios a Supabase Storage |

---

## 🗺️ Roadmap

| Fase | Estado | Descripción |
|------|--------|-------------|
| 0 — Fundación | ✅ | Auth, SRS, jefes, mapa, colección, ranking, XP, deploy |
| 1 — Audio + UX | 🔜 | Audio en flashcards, error boundaries, estados, bottom nav |
| 2 — Tienda | 📝 | `/shop` con mejoras globales (compra con XP) |
| 3 — Apariencia | 📝 | Skins de Lili, horóscopos UI |
| 4 — Juego avanzado | 💡 | Venganza, skill tree personajes, speech recognition |
| 5 — Historia | 💡 | Cinemáticas, diálogos TPRS, Luodingo fases |
| 6+ — Gamificación | 💡 | Logros, battle pass, mazmorras, eventos, PWA |

➡️ Backlog completo: [ROADMAP.md](./ROADMAP.md)

---

## 🤝 Contribuir

Este es un proyecto personal de aprendizaje. Si encontrás un bug, abrí un issue en GitHub.

---

## 📄 Licencia

MIT
