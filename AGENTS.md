<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:epilchinasequest-rules -->
# EpilChinaseQuest — Development Rules

## Single Source of Truth
- `ROADMAP.md` = everything we plan to build, organized by phase
- AGENTS.md = these rules
- Database schema = `supabase/schema.sql`
- Types = `types/index.ts`

## Workflow
1. Before coding, check ROADMAP.md to confirm no duplicate work
2. After finishing a feature, update ROADMAP.md status (✅ 🔜 📝 💡)
3. Keep the todo list (`todowrite`) synced with current sprint
4. Build must pass (`npx next build`) before push

## Priority Order
1. Bugs > Features
2. Features the user touches daily (audio, nav) > Cosmetic features
3. Incremental improvements > Rewrites

## Reminders
- Audio: Storage if `audio_path` exists, else Web Speech API TTS
- Upserts: always include `id` from existing record (no `onConflict` composite)
- RPC `add_xp` must have `if not found then return` guard
- Mobile-first: thumb zone, safe areas, tap targets >= 48px
- All text visible to user should be Spanish for navigation, Chinese for content
<!-- END:epilchinasequest-rules -->
