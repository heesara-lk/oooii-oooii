-- Run this in Supabase SQL Editor to create essay-images bucket for auto-compressed WebP uploads

-- 1. Create public bucket (if not exists via dashboard)
insert into storage.buckets (id, name, public)
values ('essay-images', 'essay-images', true)
on conflict (id) do update set public = true;

-- 2. Enable RLS is already enabled on storage.objects, but ensure policies:

-- Allow public read (anyone can view images)
drop policy if exists "Public read essay-images" on storage.objects;
create policy "Public read essay-images" on storage.objects
for select using (bucket_id = 'essay-images');

-- Allow anyone (anon + authenticated) to upload - since admin is protected by ADMIN_PASSWORD not Supabase auth
-- For tighter security, change to (auth.role() = 'authenticated') if you only upload while logged in as subscriber
drop policy if exists "Allow upload essay-images" on storage.objects;
create policy "Allow upload essay-images" on storage.objects
for insert with check (bucket_id = 'essay-images');

-- Allow update/delete for admin cleanup
drop policy if exists "Allow update essay-images" on storage.objects;
create policy "Allow update essay-images" on storage.objects
for update using (bucket_id = 'essay-images');

drop policy if exists "Allow delete essay-images" on storage.objects;
create policy "Allow delete essay-images" on storage.objects
for delete using (bucket_id = 'essay-images');

-- 3. Verify
-- select * from storage.buckets where id='essay-images';
