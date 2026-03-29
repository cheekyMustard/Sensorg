-- Extensions
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- Shops
create table if not exists shops (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Users
create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  username      text unique not null,
  password_hash text not null,
  role          text not null check (role in ('admin','manager','driver','mechanic','shopUser','cleaner','organiser','seller','socialmedia')),
  shop_id       uuid references shops(id) on delete set null,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Bikes
create table if not exists bikes (
  id         uuid primary key default gen_random_uuid(),
  label      text unique not null,
  notes      text,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bikes_label_trgm_idx on bikes using gin (label gin_trgm_ops);

-- Requests
create table if not exists requests (
  id                  uuid primary key default gen_random_uuid(),
  from_shop_id        uuid not null references shops(id),
  to_shop_id          uuid not null references shops(id),
  reason              text not null check (reason in ('rental','repair','return')),
  status              text not null default 'open' check (status in ('open','in_progress','done','cancelled')),
  date_created        date not null default current_date,
  date_rental         date not null,
  created_by_user_id  uuid references users(id) on delete set null,
  updated_by_user_id  uuid references users(id) on delete set null,
  version             int not null default 1,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint from_to_different check (from_shop_id <> to_shop_id)
);

create index if not exists requests_date_rental_idx on requests(date_rental);
create index if not exists requests_status_idx on requests(status);

-- Request ↔ Bikes (n:m)
create table if not exists request_bikes (
  id         uuid primary key default gen_random_uuid(),
  request_id uuid not null references requests(id) on delete cascade,
  bike_id    uuid not null references bikes(id),
  position   int not null default 1,
  unique (request_id, bike_id)
);

create index if not exists request_bikes_request_id_idx on request_bikes(request_id);

-- Audit log
create table if not exists request_audit_log (
  id         uuid primary key default gen_random_uuid(),
  request_id uuid not null references requests(id) on delete cascade,
  action     text not null,
  payload    jsonb,
  user_id    uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);
