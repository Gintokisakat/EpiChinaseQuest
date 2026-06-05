# EpilChinaseQuest — Roadmap

> **Inspired by**: MacaLaoshi (core mechanics), Duolingo (gamification/UX), Memrise (speed review/pronunciation), Drops (swipe study), Skritter (stroke order/writing), Anki (SRS/stats), HelloChinese (tone practice/grammar), Gacha RPGs (collection/battle pass)

## Legend

| Icon | Meaning |
|------|---------|
| ✅ | Built & deployed |
| 🔜 | In progress / next sprint |
| 📝 | Planned (designed, not built) |
| 💡 | Idea (needs design) |

---

## Phase 0 — Foundation ✅

| Feature | Status | Notes |
|---------|--------|-------|
| Auth (email/password) | ✅ | Login, signup, callback, auto-profile trigger |
| SRS (3-box: revise1 → revise2 → known) | ✅ | `/lib/game/srs.ts` |
| Review page (3 quiz modes) | ✅ | pinyin / meaning / hanzi |
| Learn page (flashcards + mini quiz) | ✅ | `/learn` with unit selector |
| Boss fights (timer, HP, lives, power-ups) | ✅ | `/mission/[id]` |
| Map with auto-unlock | ✅ | `/map` — se desbloquea por nivel + misión anterior |
| Collection (cards + characters equip) | ✅ | `/collection` |
| Leaderboard | ✅ | `/leaderboard` |
| XP/Level system | ✅ | RPC `add_xp` + `lib/game/xp.ts` |
| 14 power-ups | ✅ | `lib/game/powerups.ts` |
| 11,000 HSK 3.0 cards imported | ✅ | |
| 7,845 audio files uploaded to Storage | ✅ | |
| Deploy to Vercel | ✅ | `epi-chinase-quest.vercel.app` |

---

## Phase 1 — Audio + UX stability 🔜

| Feature | Priority | Status | Description |
|---------|----------|--------|-------------|
| Audio playback in flashcards | 🔥 High | 📝 | Button 🔊 en cada carta. Storage si existe audio_path, TTS fallback |
| Error Boundary global + per-page | 🔥 High | 📝 | Que un crash no rompa todo |
| Empty states | 🔥 High | 📝 | Mensajes amigables: colección vacía, sin resultados, etc. |
| Error handling (toast) | 🔥 High | 📝 | Cuando falla Supabase, mostrar toast en vez de silencio |
| Bottom nav (Home / Aprender / Cruzada / Perfil) | 🔥 High | 💡 | Reemplazar sidebar por bottom tabs como Duolingo |
| Dashboard redesign | Medium | 💡 | "Continue donde dejaste", streak, daily mission |

---

## Phase 2 — Tienda de mejoras 🔜

| Feature | Priority | Status | Description |
|---------|----------|--------|-------------|
| Shop page `/shop` | 🔥 High | 📝 | Grid de mejoras globales (daño, tiempo, vidas, XP boost) |
| Compra con XP | 🔥 High | 📝 | Precio escala por nivel |
| Aplicación automática | 🔥 High | 📝 | `calculateDamage()` ya acepta upgrades |
| DB upgrades + user_upgrades | ✅ | Seed data lista |

---

## Phase 3 — Apariencia

| Feature | Priority | Status | Description |
|---------|----------|--------|-------------|
| Skins de Lili (7) | Medium | 📝 | Página `/skins`, preview, desbloqueo por nivel |
| Avatar en navbar | Medium | 📝 | El skin equipado se muestra arriba |
| DB skins + user_skins | ✅ | Seed data lista |
| Horóscopos UI | Medium | 💡 | 12 categorías, filtro en colección y estudio |

---

## Phase 4 — Juego mejorado

| Feature | Priority | Status | Description |
|---------|----------|--------|-------------|
| Venganza mechanic | Medium | 📝 | `revenge_marked` cuando fallás 3+ seguidas. Función `shouldMarkRevenge()` ya existe |
| Skill Tree personajes | Medium | 💡 | Cada personaje da bonus (daño, XP, tiempo). Aplicar en boss fights |
| Speech recognition 🎤 | Medium | 💡 | Web Speech API, feedback 🟢🟡🔴 |
| Listening mode | Low | 💡 | Solo audio, elegir carta correcta |

---

## Phase 5 — Narrativa

| Feature | Priority | Status | Description |
|---------|----------|--------|-------------|
| Historia principal (Lili vs Emperatriz) | Low | 💡 | Escenas entre misiones, texto + emoji art |
| Diálogos TPRS | Low | 💡 | Frases en chino con traducción |
| Luodingo fases | Low | 💡 | 3 fases con ataques especiales |
| Cinemáticas simples | Low | 💡 | Pantallas de transición |

---

## Phase 6 — Offline + API

| Feature | Priority | Status | Description |
|---------|----------|--------|-------------|
| Offline queue (localStorage) | Low | 💡 | Respuestas offline se guardan localmente |
| `/api/save-delta` | Low | 💡 | Sincroniza respuestas offline |
| Sync indicator | Low | 💡 | "📤 3 pendientes" en navbar |
| Limpiar hooks (`useBossFight`, `useSRS`) | Low | 💡 | Decidir: arreglar o eliminar |

---

## Phase 7 — Modos de juego alternos

| Feature | Priority | Status | Description |
|---------|----------|--------|-------------|
| Speed Review ⚡ | Medium | 💡 | Responder contra reloj. 30s/60s/120s |
| Match Madness 🔀 | Low | 💡 | Emparejar hanzi ↔ pinyin en grid |
| Drops Mode 💧 | Low | 💡 | 5 min, swipe up/down, sin typing |
| Writing Practice ✍️ | Low | 💡 | Canvas HTML5, stroke order |
| Audio-only Mode 🎧 | Low | 💡 | Para hacer mientras caminás |
| Typing Mode ⌨️ | Low | 💡 | Escribir pinyin con tonos |

---

## Phase 8 — Gamificación

| Feature | Priority | Status | Description |
|---------|----------|--------|-------------|
| Logros / Achievements | Medium | 💡 | "Primer jefe", "100 correctas", "Racha 30 días" |
| Misiones diarias | Medium | 💡 | 3 misiones/día, reset 24h, XP bonus |
| Racha (Streak) | Medium | 💡 | Días consecutivos. Streak freeze. Notificaciones |
| Battle Pass 🎫 | Low | 💡 | Temporadas de 30 días. Track free + premium |
| Ranking semanal con ligas | Low | 💡 | Bronce → Plata → Oro → Diamante |
| XP Boost 2x | Low | 💡 | 15 min al completar ciertas acciones |

---

## Phase 9 — RPG profundo

| Feature | Priority | Status | Description |
|---------|----------|--------|-------------|
| Mazmorras 🏰 | Low | 💡 | Modo infinito: preguntas endless, dificultad creciente |
| Boss Rush ⚔️ | Low | 💡 | Todos los jefes en secuencia |
| Gremios / Clanes 👥 | Low | 💡 | Leaderboard grupal |
| Mascota virtual 🐉 | Low | 💡 | Crece cuando estudiás. Evoluciones |
| Eventos estacionales 🎋 | Low | 💡 | Año Nuevo Chino, rewards limitados |
| Cartas shiny raras | Low | 💡 | Bordes dorados, drop rate bajo |
| Fusión de cartas 🔮 | Low | 💡 | Fusioná 3 cartas = versión mejorada |

---

## Phase 10 — Polish + Social + Mobile

| Feature | Priority | Status | Description |
|---------|----------|--------|-------------|
| PWA (app instalable) | Medium | 💡 | Manifest + Service Worker |
| Notificaciones push | Medium | 💡 | Racha, jefe disponible, recordatorio |
| Estadísticas 📊 | Medium | 💡 | Gráficos: cartas/día, acierto por nivel, tiempo |
| Stroke Order 🖊️ | Low | 💡 | Animación SVG de trazos |
| Radicales 部首 | Low | 💡 | Página de búsqueda por radical |
| Música de fondo 🎵 | Low | 💡 | Por zona. SFX en aciertos |
| Compartir logros | Low | 💡 | Generar imagen para compartir |
| Modo oscuro/claro 🌗 | Low | 💡 | Toggle en navbar |
| Onboarding tutorial | Medium | 💡 | "Así funciona", elegí nivel, test rápido |
| Pinyin table | Low | 💡 | Tabla completa con sonidos |

---

## 🗺️ Mapa — Evolución

| Versión | Descripción | Status |
|---------|-------------|--------|
| **v1 — Lista** | Lista vertical de misiones (actual) | ✅ |
| **v2 — Nodos** | Canvas 2D con círculos conectados, scroll, animaciones | 💡 |
| **v3 — Regiones** | Fondos por zona, paleta por región, transiciones | 💡 |
| **v4 — RPG** | Scrolling horizontal estilo Mario World, secretos, cofres, fast travel | 💡 |

### Mapa v2 — UX details
- Nodo activo con anillo pulsante "👉 empezá acá"
- Líneas de conexión entre nodos
- Tooltip al hover: nombre, HP, recompensas
- Cofre al completar región
- "Jump Here" para saltar unidades (test de nivelación)
- Guidebook antes de cada jefe

---

## 🎨 UX Improvements backlog

| Técnica | Description | Status |
|---------|-------------|--------|
| Onboarding tutorial | Elegir nivel → test rápido → primera unidad | 💡 |
| Micro-interacciones | Animaciones celebratorias, confeti, mascota Lili | 💡 |
| Sonido de acierto/error | SFX como Duolingo | 💡 |
| Swipe gestures | Modo Drops: swipe up = sé, down = no sé | 💡 |
| Mobile bottom nav | Reemplazar sidebar | 💡 |
| Dashboard redesign | Tarjeta de progreso, streak, daily mission | 💡 |
| Loading states temáticos | Sin spinner genérico, tips de estudio | 💡 |
| Empty states | Mensajes amigables en cada página | 📝 |
| Toast errors | Cuando falla Supabase | 📝 |
| Accesibilidad | Modo daltónico, fuente escalable, reduced motion | 💡 |
| Push notifications | Streak, recordatorio, rewards | 💡 |
| Session flow | Abrir app → Dashboard con próxima acción | 💡 |
| Thumb zone | Botones en tercio inferior, bottom nav | 💡 |
| Haptic feedback | Vibración en acierto/error | 💡 |
| Goal gradient | Barra que acelera visualmente al final | 💡 |
| Variable rewards | No siempre lo mismo al completar nodo | 💡 |

---

## 📐 Arquitectura / Deuda técnica

| Item | Status | Description |
|------|--------|-------------|
| `useBossFight.ts` — decidir si arreglar o eliminar | 📝 | Tiene bug (options[0] incorrecto). La página usa lógica inline |
| `useSRS.ts` — decidir si arreglar o eliminar | 📝 | Opciones hardcodeadas. No se usa desde ninguna página |
| Error Boundaries por página | 📝 | |
| `onConflict` en upserts | ✅ | Arreglado en review + mission |
| `card_level` increment | ✅ | Ahora sube con cada acierto |
| Map auto-destrebe | ✅ | Por nivel + misión anterior completada |

---

## Cómo priorizamos

1. **Alta**: Bugs primero. Después features que el usuario toca todos los días (audio, navegación)
2. **Media**: Features que mejoran retención (gamificación, logros, tienda)
3. **Baja**: Features cosmeticas o complejas (historia, gremios, música, PWA)
