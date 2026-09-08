-- Gill Shooting Academy: run this once in Supabase Dashboard → SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.admissions (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 2 and 100),
  parent_name text,
  phone text not null check (phone ~ '^[0-9+ ()-]{10,20}$'),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  age smallint check (age between 5 and 100),
  gender text check (gender in ('female','male','non_binary','prefer_not_to_say')),
  city text,
  preferred_program text,
  experience_level text,
  message text check (char_length(message) <= 2000),
  status text not null default 'new' check (status in ('new','contacted','enrolled','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 100),
  phone text not null check (phone ~ '^[0-9+ ()-]{10,20}$'),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  subject text check (char_length(subject) <= 160),
  message text not null check (char_length(message) between 2 and 3000),
  status text not null default 'new' check (status in ('new','read','resolved')),
  created_at timestamptz not null default now()
);

create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  title text not null unique,
  description text not null,
  level text not null,
  duration text,
  fee numeric(10,2),
  features jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.coaches (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  role text not null,
  qualification text,
  experience_years smallint check (experience_years >= 0),
  specialization text,
  biography text,
  photo_url text,
  is_active boolean not null default true,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.facilities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  icon text,
  is_active boolean not null default true,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.gallery (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null check (category in ('academy','10m_range','25m_range','50m_range','training','events','competitions')),
  image_url text not null,
  alt_text text not null,
  is_featured boolean not null default false,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text not null,
  content text,
  image_url text,
  event_date date,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  person_name text not null,
  relationship text not null check (relationship in ('student','parent')),
  rating smallint not null check (rating between 1 and 5),
  review text not null,
  photo_url text,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  achievement_date date,
  image_url text,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now()
);

alter table public.news add column if not exists sort_order smallint not null default 0;
alter table public.testimonials add column if not exists sort_order smallint not null default 0;

create index if not exists admissions_created_at_idx on public.admissions (created_at desc);
create index if not exists admissions_status_idx on public.admissions (status);
create index if not exists contact_messages_created_at_idx on public.contact_messages (created_at desc);
create index if not exists gallery_category_idx on public.gallery (category, sort_order);
create index if not exists news_published_idx on public.news (is_published, published_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql security invoker set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;

create or replace trigger admissions_updated_at before update on public.admissions for each row execute function public.set_updated_at();
create or replace trigger programs_updated_at before update on public.programs for each row execute function public.set_updated_at();
create or replace trigger coaches_updated_at before update on public.coaches for each row execute function public.set_updated_at();
create or replace trigger news_updated_at before update on public.news for each row execute function public.set_updated_at();

alter table public.admissions enable row level security;
alter table public.contact_messages enable row level security;
alter table public.programs enable row level security;
alter table public.coaches enable row level security;
alter table public.facilities enable row level security;
alter table public.gallery enable row level security;
alter table public.news enable row level security;
alter table public.testimonials enable row level security;
alter table public.achievements enable row level security;

-- Public visitors may only submit enquiries. Read/update access stays with authenticated staff.
create policy "public can submit admissions" on public.admissions for insert to anon, authenticated with check (true);
create policy "public can send contact messages" on public.contact_messages for insert to anon, authenticated with check (true);
create policy "public reads active programs" on public.programs for select to anon, authenticated using (is_active = true);
create policy "public reads active coaches" on public.coaches for select to anon, authenticated using (is_active = true);
create policy "public reads active facilities" on public.facilities for select to anon, authenticated using (is_active = true);
create policy "public reads gallery" on public.gallery for select to anon, authenticated using (true);
create policy "public reads published news" on public.news for select to anon, authenticated using (is_published = true);
create policy "public reads published testimonials" on public.testimonials for select to anon, authenticated using (is_published = true);
create policy "public reads achievements" on public.achievements for select to anon, authenticated using (true);

insert into public.programs (title, description, level, duration, fee, features, sort_order) values
  ('Beginner Training', 'Build safe habits, confidence and a consistent foundation.', 'Beginner', '8 weeks', 0, '["Foundation focused", "Structured coaching"]', 1),
  ('Intermediate Training', 'Refine discipline, technique and match confidence.', 'Intermediate', '12 weeks', 0, '["Skill development", "Range practice"]', 2),
  ('Competitive Training', 'Structured preparation for serious athletes and events.', 'Advanced', 'Custom schedule', 0, '["Performance coaching", "Competition preparation"]', 3)
on conflict (title) do nothing;
