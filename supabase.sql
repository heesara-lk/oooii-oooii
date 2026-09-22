-- Oooii Oooii - Supabase Schema
-- Run this in Supabase SQL Editor

-- 1. Essays table (daily chapters, newest first)
create table if not exists public.essays (
  id text primary key,
  title text not null,
  date text,
  read_time text,
  image text,
  caption text,
  excerpt text,
  content jsonb not null default '[]'::jsonb,
  likes integer default 0,
  tags text[],
  created_at bigint not null
);

-- 2. Enable Row Level Security
alter table public.essays enable row level security;

-- 3. Policies - allow public read/write for now (admin is protected by UI, you can lock later)
drop policy if exists "Allow public read" on public.essays;
drop policy if exists "Allow public insert" on public.essays;
drop policy if exists "Allow public update" on public.essays;
drop policy if exists "Allow public delete" on public.essays;

create policy "Allow public read" on public.essays for select using (true);
create policy "Allow public insert" on public.essays for insert with check (true);
create policy "Allow public update" on public.essays for update using (true);
create policy "Allow public delete" on public.essays for delete using (true);

-- 4. Index for fastest newest-first sorting (important for 1000s of essays)
create index if not exists essays_created_at_idx on public.essays (created_at desc);

-- 5. Optional: Storage bucket for images (create via Dashboard > Storage > New Bucket > public)
-- If you want to use Supabase Storage, create bucket named 'essay-images' and make it public
-- Then run this to allow public access:
-- insert into storage.buckets (id, name, public) values ('essay-images', 'essay-images', true) on conflict (id) do nothing;
-- Then add storage policies (do in Storage > Policies or run below)

-- Uncomment below if you created the bucket via SQL:
-- create policy "Public read" on storage.objects for select using (bucket_id = 'essay-images');
-- create policy "Public upload" on storage.objects for insert with check (bucket_id = 'essay-images');
-- create policy "Public delete" on storage.objects for delete using (bucket_id = 'essay-images');
