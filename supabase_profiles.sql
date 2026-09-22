-- Run this in Supabase SQL Editor after essays table
-- Creates profiles for subscribers

-- 1. Profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  is_lifetime boolean default false,
  free_reads_used integer default 0,
  created_at timestamp with time zone default now()
);

-- 2. Enable RLS
alter table public.profiles enable row level security;

-- 3. Policies
-- Allow anyone to read? No, only owner can read own profile, but we need to allow insert on signup
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- 4. Auto-create profile on signup via trigger
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, is_lifetime, free_reads_used)
  values (new.id, new.email, false, 0)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. For admin view: allow reading all profiles? Optional, create admin view via service role, not needed for client
