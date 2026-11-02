-- 0002: couples and pairing
-- A "couple" is the shared space. couple_members links people to it (max 2).
-- Run this in Supabase: SQL Editor → New query → paste → Run.

-- ─── Tables ──────────────────────────────────────────────────────────────

create table public.couples (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Our space' check (char_length(name) between 1 and 60),
  timezone text not null default 'UTC',
  -- Code the partner types in (or opens as a link) to join. Cleared once both have joined.
  invite_code text unique,
  invite_expires_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.couple_members (
  couple_id uuid not null references public.couples (id) on delete cascade,
  -- unique: each person belongs to at most one couple
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (couple_id, user_id)
);

-- ─── Helper functions used by security rules ─────────────────────────────
-- "security definer" means the function can look at couple_members even
-- though the caller normally can't see every row. They only ever answer
-- questions about the caller themselves (auth.uid()).

-- Is the current user a member of this couple?
create function public.is_member(target_couple uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.couple_members
    where couple_id = target_couple and user_id = (select auth.uid())
  );
$$;

-- The current user's couple id (or null if they haven't paired yet).
create function public.my_couple_id()
returns uuid
language sql stable security definer set search_path = ''
as $$
  select couple_id from public.couple_members where user_id = (select auth.uid());
$$;

-- ─── Row-level security ──────────────────────────────────────────────────

alter table public.couples enable row level security;
alter table public.couple_members enable row level security;

-- You can see and rename your own couple. Creating/joining goes through the
-- functions below, so there are no insert/delete policies.
create policy "Members read their couple"
  on public.couples for select to authenticated
  using (public.is_member(id));

create policy "Members update their couple"
  on public.couples for update to authenticated
  using (public.is_member(id))
  with check (public.is_member(id));

create policy "Members read their couple's members"
  on public.couple_members for select to authenticated
  using (public.is_member(couple_id));

-- You can now also see your partner's profile (but nobody else's).
create policy "Read partner profile"
  on public.profiles for select to authenticated
  using (id in (select user_id from public.couple_members where couple_id = public.my_couple_id()));

-- Only these columns of a couple may be changed directly by members.
revoke update on public.couples from authenticated;
grant update (name, timezone) on public.couples to authenticated;

-- ─── Safety net: never more than 2 people in a couple ────────────────────

create function public.enforce_two_members()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if (select count(*) from public.couple_members where couple_id = new.couple_id) >= 2 then
    raise exception 'This space already has two people in it.';
  end if;
  return new;
end;
$$;

create trigger couple_members_max_two
  before insert on public.couple_members
  for each row execute function public.enforce_two_members();

-- ─── Invite codes ────────────────────────────────────────────────────────

-- 6 characters, skipping look-alikes (0/O, 1/I/L) so it's easy to type.
create function public.generate_invite_code()
returns text
language plpgsql volatile set search_path = ''
as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  code text;
begin
  loop
    code := '';
    for i in 1..6 loop
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.couples where invite_code = code);
  end loop;
  return code;
end;
$$;

-- ─── Actions the app calls (via supabase.rpc) ────────────────────────────

-- Create a new couple space with you in it. Returns the new couple's id.
create function public.create_couple(space_name text default 'Our space', tz text default 'UTC')
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  me uuid := auth.uid();
  new_id uuid;
begin
  if me is null then raise exception 'Please log in first.'; end if;
  if exists (select 1 from public.couple_members where user_id = me) then
    raise exception 'You are already in a space.';
  end if;

  insert into public.couples (name, timezone, invite_code, invite_expires_at, created_by)
  values (
    coalesce(nullif(trim(space_name), ''), 'Our space'),
    coalesce(nullif(tz, ''), 'UTC'),
    public.generate_invite_code(),
    now() + interval '7 days',
    me
  )
  returning id into new_id;

  insert into public.couple_members (couple_id, user_id) values (new_id, me);
  return new_id;
end;
$$;

-- Join your partner's space with their invite code. Returns the couple's id.
create function public.join_couple(code text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  me uuid := auth.uid();
  target public.couples%rowtype;
begin
  if me is null then raise exception 'Please log in first.'; end if;
  if exists (select 1 from public.couple_members where user_id = me) then
    raise exception 'You are already in a space.';
  end if;

  -- "for update" locks the row so two people can't join at the same moment.
  select * into target from public.couples
  where invite_code = upper(trim(code))
  for update;

  if not found then raise exception 'That code doesn''t match any space. Check it and try again?'; end if;
  if target.invite_expires_at < now() then
    raise exception 'That code has expired. Ask your partner for a new one.';
  end if;

  insert into public.couple_members (couple_id, user_id) values (target.id, me);

  -- Both people are in now, so the code is no longer needed.
  update public.couples set invite_code = null, invite_expires_at = null where id = target.id;
  return target.id;
end;
$$;

-- Get a fresh invite code (e.g. the old one expired). Returns the new code.
create function public.refresh_invite_code()
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  cid uuid := public.my_couple_id();
  new_code text;
begin
  if cid is null then raise exception 'You are not in a space yet.'; end if;
  if (select count(*) from public.couple_members where couple_id = cid) >= 2 then
    raise exception 'Your space is already complete.';
  end if;
  new_code := public.generate_invite_code();
  update public.couples
  set invite_code = new_code, invite_expires_at = now() + interval '7 days'
  where id = cid;
  return new_code;
end;
$$;

-- Only logged-in users may call these; logged-out visitors can't.
revoke execute on function public.create_couple(text, text) from public, anon;
revoke execute on function public.join_couple(text) from public, anon;
revoke execute on function public.refresh_invite_code() from public, anon;
revoke execute on function public.generate_invite_code() from public, anon, authenticated;
revoke execute on function public.enforce_two_members() from public, anon, authenticated;
grant execute on function public.create_couple(text, text) to authenticated;
grant execute on function public.join_couple(text) to authenticated;
grant execute on function public.refresh_invite_code() to authenticated;
