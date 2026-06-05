create or replace function public.buy_upgrade(user_id uuid, upgrade_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  current_xp integer;
  upgrade_cost integer;
  current_level integer;
begin
  select p.xp into current_xp
  from public.profiles p
  where p.id = user_id;

  if not found then
    raise warning 'Profile not found for user %', user_id;
    return;
  end if;

  select u.cost, coalesce(uu.level, 0) into upgrade_cost, current_level
  from public.upgrades u
  left join public.user_upgrades uu on uu.upgrade_id = u.id and uu.user_id = buy_upgrade.user_id
  where u.id = upgrade_id;

  upgrade_cost := upgrade_cost * (current_level + 1);

  if current_xp < upgrade_cost then
    raise exception 'Not enough XP. Need %, have %', upgrade_cost, current_xp;
  end if;

  update public.profiles
  set xp = xp - upgrade_cost
  where id = user_id;

  insert into public.user_upgrades (user_id, upgrade_id, level)
  values (user_id, upgrade_id, 1)
  on conflict (user_id, upgrade_id)
  do update set level = user_upgrades.level + 1;
end;
$$;
