-- Global Upgrades (permanent shop items)
insert into public.upgrades (name, description, effect_type, effect_value, cost, icon) values
  ('Fuerza de Lili', 'Aumenta el daño base +5%', 'damage', 5, 100, '⚔️'),
  ('Escudo de Lili', 'Reduce daño recibido -10%', 'defense', 10, 100, '🛡️'),
  ('Tiempo de Lili', '+10 segundos en misiones', 'time', 10, 150, '⏰'),
  ('Vida Extra', '+1 vida inicial en misiones', 'life', 1, 200, '❤️'),
  ('Maestro Pinyin', '+10% daño en modo pinyin', 'damage_pinyin', 10, 150, '🔤'),
  ('Maestro Hanzi', '+10% daño en modo hanzi', 'damage_hanzi', 10, 150, '🀄'),
  ('Racha Poderosa', '+1 daño por cada día de racha', 'streak_bonus', 1, 200, '🔥'),
  ('Coleccionista', '+2 XP por carta acertada', 'xp_bonus', 2, 100, '⭐'),
  ('Velocidad de Relámpago', 'Las opciones aparecen 1s más rápido', 'speed', 1, 250, '⚡'),
  ('Corazón de Dragón', '+25% daño en boss fights', 'boss_damage', 25, 500, '🐉');

-- Skins (7 collectible skins)
insert into public.skins (name, emoji, unlock_condition) values
  ('Lili Clásica', '👧', 'Completar el tutorial'),
  ('Lili de Fuego', '🔥', 'Derrotar a Cruzar el Bosque'),
  ('Lili de Hielo', '❄️', 'Derrotar a Cruzar el Mar'),
  ('Lili de Trueno', '⚡', 'Derrotar a Cruzar el Cielo'),
  ('Lili Dragón', '🐉', 'Derrotar a La Emperatriz'),
  ('Lili Dorada', '👑', 'Alcanzar nivel 50'),
  ('Lili Legendaria', '✨', 'Coleccionar 1000 cartas');
