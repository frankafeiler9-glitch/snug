-- 0004: shared calendar events
-- Run this in Supabase: SQL Editor → New query → paste → Run.

create table public.events (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null default public.my_couple_id() references public.couples (id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 100),
  notes text check (char_length(notes) <= 1000),
  starts_at timestamptz not null,
  -- For all-day events, ends_at is midnight at the *start of the day after* the last day.
  ends_at timestamptz not null,
  all_day boolean not null default false,
  -- Whose event is it? null = "ours" (both of you); otherwise one partner's id.
  -- "Mine"/"theirs" is worked out in the app depending on who is looking.
  owner_id uuid references public.profiles (id) on delete set null,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at >= starts_at)
);

-- Makes "events this week for our couple" fast.
create index events_couple_time_idx on public.events (couple_id, starts_at);

-- ─── Row-level security: only your couple's events ───────────────────────

alter table public.events enable row level security;

-- Is `person` in this couple? Used to check that an event's owner is one of the two of you.
create function public.is_member_of(target_couple uuid, person uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.couple_members where couple_id = target_couple and user_id = person
  )
  -- Only answers questions about your own couple.
  and public.is_member(target_couple);
$$;

create policy "Members read their events"
  on public.events for select to authenticated
  using (public.is_member(couple_id));

create policy "Members add events"
  on public.events for insert to authenticated
  with check (
    public.is_member(couple_id)
    and created_by = (select auth.uid())
    and (owner_id is null or public.is_member_of(couple_id, owner_id))
  );

create policy "Members update their events"
  on public.events for update to authenticated
  using (public.is_member(couple_id))
  with check (
    public.is_member(couple_id)
    and (owner_id is null or public.is_member_of(couple_id, owner_id))
  );

create policy "Members delete their events"
  on public.events for delete to authenticated
  using (public.is_member(couple_id));

-- ─── Keep updated_at fresh ───────────────────────────────────────────────

create function public.touch_updated_at()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger events_touch_updated_at
  before update on public.events
  for each row execute function public.touch_updated_at();

-- ─── Real-time updates ───────────────────────────────────────────────────

alter publication supabase_realtime add table public.events;
