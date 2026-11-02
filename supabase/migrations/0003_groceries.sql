-- 0003: shared grocery list
-- Run this in Supabase: SQL Editor → New query → paste → Run.

create table public.grocery_items (
  id uuid primary key default gen_random_uuid(),
  -- Defaults to your own couple, so the app doesn't have to send it.
  couple_id uuid not null default public.my_couple_id() references public.couples (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  quantity text check (char_length(quantity) <= 30),  -- optional, e.g. "2 L" (not used in the UI yet)
  category text not null default 'other' check (char_length(category) <= 30),  -- keys from src/features/groceries/categories.ts
  is_checked boolean not null default false,
  checked_by uuid references public.profiles (id) on delete set null,
  checked_at timestamptz,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index grocery_items_couple_id_idx on public.grocery_items (couple_id);

-- ─── Row-level security: only your couple's items ────────────────────────

alter table public.grocery_items enable row level security;

create policy "Members read their groceries"
  on public.grocery_items for select to authenticated
  using (public.is_member(couple_id));

create policy "Members add groceries"
  on public.grocery_items for insert to authenticated
  with check (public.is_member(couple_id) and created_by = (select auth.uid()));

create policy "Members update their groceries"
  on public.grocery_items for update to authenticated
  using (public.is_member(couple_id))
  with check (public.is_member(couple_id));

create policy "Members delete their groceries"
  on public.grocery_items for delete to authenticated
  using (public.is_member(couple_id));

-- ─── Remember who ticked an item off, and when ───────────────────────────

create function public.grocery_track_checked()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  if new.is_checked is distinct from old.is_checked then
    new.checked_by := case when new.is_checked then auth.uid() else null end;
    new.checked_at := case when new.is_checked then now() else null end;
  end if;
  return new;
end;
$$;

create trigger grocery_items_track_checked
  before update on public.grocery_items
  for each row execute function public.grocery_track_checked();

-- ─── Real-time: tell the app instantly when an item changes ──────────────
-- (Realtime respects the row-level security rules above.)

alter publication supabase_realtime add table public.grocery_items;
