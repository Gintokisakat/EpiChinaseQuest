-- ============================================
-- EpilChinaseQuest Schema
-- ============================================

-- 0. Extensions
create extension if not exists "pgcrypto";

-- 1. Cards (HSK 3.0 vocabulary)
create table if not exists cards (
  id uuid primary key default gen_random_uuid(),
  hanzi text not null,
  pinyin text not null,
  pos text not null default '',
  level smallint not null,
  english text not null,
  audio_path text,
  unit smallint not null default 1,
  is_horoscope boolean not null default false,
  horoscope_category text,
  created_at timestamptz not null default now()
);

create index idx_cards_level on cards(level);
create index idx_cards_unit on cards(unit);

-- 2. Profiles (extends auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  xp integer not null default 0,
  level smallint not null default 1,
  daily_streak smallint not null default 0,
  last_played_date date,
  created_at timestamptz not null default now()
);

-- 3. User Cards (SRS state + card levels)
create table if not exists user_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  card_id uuid not null references cards(id) on delete cascade,
  known boolean not null default false,
  revise1 boolean not null default false,
  revise2 boolean not null default false,
  card_level smallint not null default 0,
  challenge_streak smallint not null default 0,
  challenge_best smallint not null default 0,
  revenge_marked boolean not null default false,
  dk_added_at timestamptz,
  modified boolean not null default false,
  unique(user_id, card_id)
);

create index idx_user_cards_user on user_cards(user_id);
create index idx_user_cards_known on user_cards(user_id, known);
create index idx_user_cards_revise on user_cards(user_id, revise1, revise2);

-- 4. Characters (collectible characters)
create table if not exists characters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  rarity text not null default 'common',
  emoji text not null,
  description text,
  created_at timestamptz not null default now()
);

-- 5. User Characters (owned character cards)
create table if not exists user_characters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  character_id uuid not null references characters(id) on delete cascade,
  xp integer not null default 0,
  is_equipped boolean not null default false,
  unique(user_id, character_id)
);

-- 6. Missions (boss definitions)
create table if not exists missions (
  id uuid primary key default gen_random_uuid(),
  boss_id text unique not null,
  name text not null,
  display_name text not null,
  hp integer not null,
  timer_secs integer not null,
  lives smallint not null default 3,
  card_pool jsonb not null default '{}',
  color text not null default 'blue',
  level_required smallint not null default 1,
  order_index smallint not null default 0,
  created_at timestamptz not null default now()
);

-- 7. User Missions (progress)
create table if not exists user_missions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  mission_id uuid not null references missions(id) on delete cascade,
  status text not null default 'locked' check (status in ('locked','unlocked','completed')),
  high_score integer not null default 0,
  completed_at timestamptz,
  unique(user_id, mission_id)
);

-- 8. Global Upgrades (permanent shop items)
create table if not exists upgrades (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  effect_type text not null,
  effect_value real not null,
  cost integer not null,
  icon text not null default '⬆',
  created_at timestamptz not null default now()
);

-- 9. User Upgrades
create table if not exists user_upgrades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  upgrade_id uuid not null references upgrades(id) on delete cascade,
  level smallint not null default 1,
  unique(user_id, upgrade_id)
);

-- 10. Skins
create table if not exists skins (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  emoji text not null,
  unlock_condition text not null default '',
  created_at timestamptz not null default now()
);

-- 11. User Skins
create table if not exists user_skins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  skin_id uuid not null references skins(id) on delete cascade,
  is_equipped boolean not null default false,
  unique(user_id, skin_id)
);

-- 12. Pending Operations (offline sync queue)
create table if not exists pending_ops (
  id bigint primary key generated always as identity,
  user_id uuid not null references profiles(id) on delete cascade,
  op_type text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

-- ============================================
-- Functions & Triggers
-- ============================================

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    new.raw_user_meta_data ->> 'username',
    coalesce(new.raw_user_meta_data ->> 'display_name', new.email)
  );

  -- Assign 3 starter characters
  insert into public.user_characters (user_id, character_id, is_equipped)
  select new.id, id, true
  from public.characters
  order by random()
  limit 3;

  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- Row Level Security
-- ============================================

alter table cards enable row level security;
alter table profiles enable row level security;
alter table user_cards enable row level security;
alter table characters enable row level security;
alter table user_characters enable row level security;
alter table missions enable row level security;
alter table user_missions enable row level security;
alter table upgrades enable row level security;
alter table user_upgrades enable row level security;
alter table skins enable row level security;
alter table user_skins enable row level security;

-- Public tables (readable by all authenticated users)
create policy "cards read all" on cards for select to authenticated using (true);
create policy "characters read all" on characters for select to authenticated using (true);
create policy "missions read all" on missions for select to authenticated using (true);
create policy "upgrades read all" on upgrades for select to authenticated using (true);
create policy "skins read all" on skins for select to authenticated using (true);

-- User owns their own data
create policy "profiles own" on profiles for all to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "user_cards own" on user_cards for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "user_characters own" on user_characters for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "user_missions own" on user_missions for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "user_upgrades own" on user_upgrades for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "user_skins own" on user_skins for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "pending_ops own" on pending_ops for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
