-- Seed Missions (9 bosses + 12 horoscope challenges)
insert into public.missions (boss_id, name, display_name, hp, timer_secs, lives, card_pool, color, level_required, order_index) values
  ('cruzarBosque', 'cruzarBosque', '🌲 Cruzar el Bosque', 2000, 240, 3, '{"levels": [1], "units": [1,2,3,4,5,6]}'::jsonb, 'green', 1, 1),
  ('cruzarMar', 'cruzarMar', '🌊 Cruzar el Mar', 5000, 240, 3, '{"levels": [1]}'::jsonb, 'cyan', 2, 2),
  ('cruzarMontana', 'cruzarMontana', '⛰️ Cruzar la Montaña', 4000, 240, 3, '{"levels": [2], "units": [1,2,3,4,5,6,7]}'::jsonb, 'lime', 3, 3),
  ('cruzarCielo', 'cruzarCielo', '☁️ Cruzar el Cielo', 6000, 300, 3, '{"levels": [2]}'::jsonb, 'orange', 4, 4),
  ('cruzarL3', 'cruzarL3', '📘 Cruzar L3', 6000, 360, 3, '{"levels": [3]}'::jsonb, 'amber', 5, 5),
  ('cruzarL4', 'cruzarL4', '📙 Cruzar L4', 7000, 420, 3, '{"levels": [4]}'::jsonb, 'gray', 6, 6),
  ('emperatriz', 'emperatriz', '👑 La Emperatriz', 15000, 300, 3, '{"levels": [1,2,3], "horoscope": true}'::jsonb, 'orange', 7, 7),
  ('bestias12', 'bestias12', '🐉 Las 12 Bestias', 8000, 300, 3, '{"horoscope": true}'::jsonb, 'green', 8, 8),
  ('luodingoF1', 'luodingoF1', '🦉 Luodingo Fase 1', 10000, 300, 3, '{"levels": [1,2,3,4], "horoscope": true}'::jsonb, 'purple', 9, 9),
  ('luodingoF2', 'luodingoF2', '🦉 Luodingo Fase 2', 7000000, 300, 3, '{"levels": [5,6,7]}'::jsonb, 'purple', 10, 10);
