-- Function to add XP and handle level up
create or replace function public.add_xp(user_id uuid, xp_amount integer)
returns void
language plpgsql
security definer
as $$
declare
  current_xp integer;
  current_level integer;
  xp_needed integer;
begin
  select p.xp, p.level into current_xp, current_level
  from public.profiles p
  where p.id = user_id;

  current_xp := current_xp + xp_amount;

  -- Check for level up
  loop
    if current_level = 1 then
      xp_needed := 10;
    elsif current_level = 2 then
      xp_needed := 50;
    elsif current_level = 3 then
      xp_needed := 100;
    else
      xp_needed := (current_level - 1) * 100;
    end if;

    exit when current_xp < xp_needed;

    current_xp := current_xp - xp_needed;
    current_level := current_level + 1;
  end loop;

  update public.profiles
  set xp = current_xp,
      level = current_level,
      last_played_date = now()::date
  where id = user_id;
end;
$$;
