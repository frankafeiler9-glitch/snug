-- 0001: profiles
-- One row per person, created automatically when someone signs up.
-- Run this in Supabase: SQL Editor → New query → paste → Run.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  created_at timestamptz not null default now()
);

-- Row-level security: nobody can read or change rows unless a policy allows it.
alter table public.profiles enable row level security;

-- You can see and edit your own profile.
-- (Step 2 adds a policy so you can also see your partner's.)
create policy "Read own profile"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

create policy "Update own profile"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Automatically create a profile when a new user signs up.
-- The display name comes from the signup form (stored in user metadata).
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), 'Me')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
