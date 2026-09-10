-- Run AFTER schema.sql in Supabase Dashboard → SQL Editor.
-- Create the Auth user first in Dashboard → Authentication → Users → Add user.
-- Do not put passwords in this SQL file or in browser code.

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.academy_settings (
  setting_key text primary key check (setting_key ~ '^[a-z0-9_]{2,64}$'),
  setting_value text not null,
  updated_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_users where user_id = (select auth.uid()));
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

alter table public.admin_users enable row level security;
alter table public.academy_settings enable row level security;

drop policy if exists "admins read own admin record" on public.admin_users;
create policy "admins read own admin record" on public.admin_users for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "admins manage academy settings" on public.academy_settings;
create policy "admins manage academy settings" on public.academy_settings for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "public reads academy settings" on public.academy_settings;
create policy "public reads academy settings" on public.academy_settings for select to anon, authenticated using (true);

-- Add least-privilege admin CRUD permissions to the existing website tables.
do $$
declare table_name text;
begin
  foreach table_name in array array['programs','coaches','facilities','gallery','news','testimonials','achievements','admissions','contact_messages']
  loop
    execute format('drop policy if exists "admins manage %1$s" on public.%1$I', table_name);
    execute format('create policy "admins manage %1$s" on public.%1$I for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()))', table_name);
    execute format('grant select, insert, update, delete on public.%1$I to authenticated', table_name);
  end loop;
end $$;

grant select, insert, update, delete on public.academy_settings to authenticated;
grant select on public.admin_users to authenticated;

-- Public CDN bucket for website/gallery imagery. Only authenticated admins can write to it.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('academy-media', 'academy-media', true, 10485760, array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public reads academy media" on storage.objects;
create policy "public reads academy media" on storage.objects for select to anon, authenticated using (bucket_id = 'academy-media');
drop policy if exists "admins upload academy media" on storage.objects;
create policy "admins upload academy media" on storage.objects for insert to authenticated with check (bucket_id = 'academy-media' and (select public.is_admin()));
drop policy if exists "admins update academy media" on storage.objects;
create policy "admins update academy media" on storage.objects for update to authenticated using (bucket_id = 'academy-media' and (select public.is_admin())) with check (bucket_id = 'academy-media' and (select public.is_admin()));
drop policy if exists "admins delete academy media" on storage.objects;
create policy "admins delete academy media" on storage.objects for delete to authenticated using (bucket_id = 'academy-media' and (select public.is_admin()));

-- Run this after creating the admin user in Supabase Auth. It is safe to run again.
insert into public.admin_users (user_id)
select id from auth.users where email = 'techaadi007@gmail.com'
on conflict (user_id) do nothing;
