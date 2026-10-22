-- =====================================================================
-- Migration: 001_initial_schema
-- ReviewLink – Dynamic QR Code & NFC Redirector
-- Jalankan di Supabase SQL Editor atau via `supabase db push`
-- =====================================================================

-- ─── 1. Enums ─────────────────────────────────────────────────────────────
create type link_status as enum ('active', 'paused', 'archived');
create type scan_source as enum ('qr', 'nfc', 'unknown');
create type user_role   as enum ('admin', 'operator');

-- ─── 2. Profiles (extends auth.users) ────────────────────────────────────
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  role       user_role not null default 'admin',
  full_name  text,
  created_at timestamptz not null default now()
);

-- Auto-create profile on new user signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name)
  values (new.id, 'admin', new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── 3. Merchants ────────────────────────────────────────────────────────
create table public.merchants (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  contact_name    text,
  contact_phone   text,
  google_place_id text,
  notes           text,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- updated_at trigger for merchants
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger merchants_updated_at
  before update on public.merchants
  for each row execute procedure public.set_updated_at();

-- ─── 4. Links ────────────────────────────────────────────────────────────
create table public.links (
  id          uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete restrict,
  slug        text not null unique
              check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
                     and char_length(slug) between 3 and 40),
  label       text,
  target_url  text not null
              check (target_url ~* '^https://' and char_length(target_url) <= 2048),
  status      link_status not null default 'active',
  created_by  uuid references auth.users(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index links_merchant_id_idx on public.links (merchant_id);
create index links_status_idx on public.links (status);

create trigger links_updated_at
  before update on public.links
  for each row execute procedure public.set_updated_at();

-- ─── 5. Link Target History (Audit Trail) ────────────────────────────────
create table public.link_target_history (
  id             bigint generated always as identity primary key,
  link_id        uuid not null references public.links(id) on delete cascade,
  old_target_url text,
  new_target_url text not null,
  changed_by     uuid references auth.users(id),
  changed_at     timestamptz not null default now()
);

create index lth_link_id_idx on public.link_target_history (link_id, changed_at desc);

-- ─── 6. Scan Events ──────────────────────────────────────────────────────
create table public.scan_events (
  id          bigint generated always as identity primary key,
  link_id     uuid not null references public.links(id) on delete cascade,
  scanned_at  timestamptz not null default now(),
  source      scan_source not null default 'unknown',
  device_type text,
  os          text,
  country     text,
  is_bot      boolean not null default false
);

create index scan_events_link_time_idx on public.scan_events (link_id, scanned_at desc);
create index scan_events_time_idx on public.scan_events (scanned_at);
create index scan_events_bot_idx on public.scan_events (is_bot, scanned_at desc);

-- ─── 7. RLS Policies ─────────────────────────────────────────────────────
-- Enable RLS on all tables
alter table public.profiles        enable row level security;
alter table public.merchants       enable row level security;
alter table public.links           enable row level security;
alter table public.link_target_history enable row level security;
alter table public.scan_events     enable row level security;

-- profiles: admin dapat baca sendiri
create policy "admin can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- merchants: admin dapat CRUD
create policy "admin full access merchants"
  on public.merchants for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- links: admin dapat CRUD
create policy "admin full access links"
  on public.links for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- link_target_history: admin dapat baca
create policy "admin can view history"
  on public.link_target_history for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- link_target_history: service role dapat insert (via server-side code)
-- scan_events: hanya service role yang dapat insert (via redirect engine)
-- Catatan: service_role otomatis melewati RLS

-- ─── 8. Analytics RPC ─────────────────────────────────────────────────────
create or replace function public.get_link_stats(
  p_from timestamptz,
  p_to   timestamptz
)
returns table (
  link_id       uuid,
  slug          text,
  label         text,
  merchant_name text,
  total_scans   bigint,
  qr_scans      bigint,
  nfc_scans     bigint
)
language sql security definer
as $$
  select
    l.id         as link_id,
    l.slug,
    l.label,
    m.name       as merchant_name,
    count(se.id) filter (where se.is_bot = false)              as total_scans,
    count(se.id) filter (where se.is_bot = false and se.source = 'qr')  as qr_scans,
    count(se.id) filter (where se.is_bot = false and se.source = 'nfc') as nfc_scans
  from public.links l
  join public.merchants m on m.id = l.merchant_id
  left join public.scan_events se
    on se.link_id = l.id
    and se.scanned_at between p_from and p_to
  group by l.id, l.slug, l.label, m.name
  order by total_scans desc;
$$;

-- ─── 9. Reserved Slugs (opsional, untuk validasi di level DB) ─────────────
create table public.reserved_slugs (
  slug text primary key
);

insert into public.reserved_slugs (slug) values
  ('admin'), ('api'), ('login'), ('logout'), ('r'), ('_next'),
  ('static'), ('public'), ('favicon'), ('robots'), ('sitemap'),
  ('health'), ('status');

-- ─── 10. Seed Data (opsional, untuk development) ─────────────────────────
-- Hapus komentar berikut untuk menambahkan data uji:
/*
insert into public.merchants (name, contact_name, notes) values
  ('Kopi Senja Tebet', 'Budi Santoso', 'Merchant pilot pertama'),
  ('Bakmi Gajah Mada', 'Siti Rahayu', 'Merchant pilot kedua');
*/
