-- ============================================================
-- 云南 AI 旅行管家 — 数据库 Schema (Supabase / PostgreSQL)
-- ============================================================

create extension if not exists "uuid-ossp";

create table "user" (
  id uuid primary key default uuid_generate_v4(),
  travel_style text check (travel_style in ('budget','balanced','comfort')) default 'balanced',
  party_size int default 2,
  budget_level text,
  preferences jsonb default '{}',
  created_at timestamptz default now()
);

create table trip (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references "user"(id),
  title text not null,
  start_date date not null,
  end_date date not null,
  cities text[] default '{}',
  created_at timestamptz default now()
);

create table day (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid references trip(id) on delete cascade,
  date date not null,
  city text not null,
  weather_snapshot jsonb
);

create table place (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  city text not null,
  category text,
  lat double precision,
  lng double precision,
  requires_reservation boolean default false
);

create table activity (
  id uuid primary key default uuid_generate_v4(),
  day_id uuid references day(id) on delete cascade,
  place_id uuid references place(id),
  planned_time time,
  duration_minutes int,
  reasoning text,
  status text check (status in ('planned','confirmed','skipped','done')) default 'planned'
);

create table source (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  domain text not null,
  trust_level text check (trust_level in ('official','trusted_ota','media','blacklisted')) not null,
  notes text
);

insert into source (name, domain, trust_level, notes) values
  ('携程门票', 'piao.qunar.com', 'trusted_ota', '票务详情页，非游记'),
  ('携程主站', 'ctrip.com', 'trusted_ota', '票务详情页，非游记'),
  ('美团', 'meituan.com', 'trusted_ota', ''),
  ('飞猪', 'fliggy.com', 'trusted_ota', ''),
  ('政府官网', 'gov.cn', 'official', '任意 .gov.cn 域名'),
  ('12306', '12306.cn', 'official', '铁路官方'),
  ('携程游记/攻略', 'you.ctrip.com', 'media', '攻略非票价来源，仅背景参考'),
  ('本地宝', 'bendibao.com', 'media', '资讯类站点，价格易过期，仅背景参考');

create table ticket (
  id uuid primary key default uuid_generate_v4(),
  place_id uuid references place(id),
  source_id uuid references source(id),
  title text,
  price numeric not null,
  currency text default 'CNY',
  includes text[] default '{}',
  cancellation_policy text,
  requires_realname boolean default false,
  valid_date daterange,
  purchase_url text not null,
  checked_at timestamptz not null default now()
);

create table transport_option (
  id uuid primary key default uuid_generate_v4(),
  from_place_id uuid references place(id),
  to_place_id uuid references place(id),
  mode text check (mode in ('train','bus','carpool','charter','taxi')) not null,
  base_price numeric not null,
  connection_cost numeric default 0,
  total_cost numeric generated always as (base_price + connection_cost) stored,
  duration_minutes int,
  comfort_score int check (comfort_score between 1 and 5),
  party_size_min int default 1,
  party_size_max int,
  source_id uuid references source(id),
  purchase_url text,
  checked_at timestamptz not null default now()
);

create table booking_status (
  id uuid primary key default uuid_generate_v4(),
  entity_type text check (entity_type in ('ticket','transport_option')),
  entity_id uuid not null,
  status text check (status in ('not_open','open','sold_out','not_required')) not null,
  open_date_estimate date,
  urgency_note text,
  checked_at timestamptz not null default now()
);

create table recommendation (
  id uuid primary key default uuid_generate_v4(),
  entity_type text not null,
  place_id uuid references place(id),
  recommended_entity_id uuid,
  reasoning text not null,
  confidence text check (confidence in ('high','medium','low')) not null,
  candidate_ids uuid[],
  generated_at timestamptz default now()
);

create table weather (
  id uuid primary key default uuid_generate_v4(),
  day_id uuid references day(id) on delete cascade,
  condition text,
  temp_low int,
  temp_high int,
  rain_probability int,
  source_id uuid references source(id),
  checked_at timestamptz not null default now()
);

create index idx_ticket_place on ticket(place_id);
create index idx_ticket_checked_at on ticket(checked_at);
create index idx_transport_route on transport_option(from_place_id, to_place_id);
create index idx_transport_checked_at on transport_option(checked_at);
