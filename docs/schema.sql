-- ============================================================
-- SensOrg – Reference Schema
-- PostgreSQL 14+
--
-- This file is documentation. The authoritative source that
-- is actually executed is db/migrations/001_initial.sql.
-- ============================================================

-- Required extensions
create extension "pgcrypto";   -- gen_random_uuid()
create extension "pg_trgm";    -- fuzzy search on bikes.label


-- ------------------------------------------------------------
-- shops
--   One row per physical location (e.g. "Arcos", "THB", "Plaza").
--   Users and requests are scoped to a shop.
-- ------------------------------------------------------------
create table shops (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- ------------------------------------------------------------
-- users
--   shop_id is nullable for admin accounts that span all shops.
--   Roles control both API access and which UI actions appear.
-- ------------------------------------------------------------
create table users (
  id            uuid        primary key default gen_random_uuid(),
  username      text        unique not null,
  password_hash text        not null,                          -- bcrypt
  role          text        not null check (role in (
                              'admin',
                              'manager',
                              'driver',
                              'mechanic',
                              'shopUser',
                              'cleaner',
                              'organiser',
                              'seller',
                              'socialmedia'
                            )),
  shop_id       uuid        references shops(id) on delete set null,
  is_active     boolean     not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);


-- ------------------------------------------------------------
-- bikes
--   Global inventory; label is the human-readable identifier
--   (e.g. "TREK-001"). Labels are unique and stored uppercase.
--   GIN index enables fast fuzzy search via pg_trgm.
--   current_shop_id tracks where the bike physically is right now;
--   updated automatically when a delivery request is marked done.
-- ------------------------------------------------------------
create table bikes (
  id               uuid        primary key default gen_random_uuid(),
  label            text        unique not null,
  notes            text,
  current_shop_id  uuid        references shops(id) on delete set null,
  is_active        boolean     not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index bikes_label_trgm_idx on bikes using gin (label gin_trgm_ops);


-- ------------------------------------------------------------
-- requests
--   A request to move one or more bikes from one shop to
--   another by a given rental date.
--
--   Status machine:
--     open → in_progress → done
--                        ↘ cancelled
--     open              → cancelled
--
--   version: incremented on every update for optimistic locking.
--   date_rental: the day the bike must arrive at to_shop.
-- ------------------------------------------------------------
create table requests (
  id                 uuid        primary key default gen_random_uuid(),
  from_shop_id       uuid        not null references shops(id),
  to_shop_id         uuid        not null references shops(id),
  reason             text        not null check (reason in ('rental', 'repair', 'return')),
  status             text        not null default 'open'
                                           check (status in ('open', 'in_progress', 'done', 'cancelled')),
  date_created       date        not null default current_date,
  date_rental        date        not null,
  created_by_user_id uuid        references users(id) on delete set null,
  updated_by_user_id uuid        references users(id) on delete set null,
  version            int         not null default 1,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  constraint from_to_different check (from_shop_id <> to_shop_id)
);

create index requests_date_rental_idx on requests(date_rental);
create index requests_status_idx      on requests(status);


-- ------------------------------------------------------------
-- request_bikes
--   Many-to-many join between requests and bikes.
--   position preserves the order in which bikes were entered.
--   Cascade delete keeps join rows tidy if a request is removed.
-- ------------------------------------------------------------
create table request_bikes (
  id         uuid primary key default gen_random_uuid(),
  request_id uuid not null references requests(id) on delete cascade,
  bike_id    uuid not null references bikes(id),
  position   int  not null default 1,

  unique (request_id, bike_id)
);

create index request_bikes_request_id_idx on request_bikes(request_id);


-- ------------------------------------------------------------
-- request_audit_log
--   Append-only log written on every status change and update.
--   payload (jsonb) carries the before/after values.
--   Rows are deleted automatically when the parent request is
--   hard-deleted (admin only).
-- ------------------------------------------------------------
create table request_audit_log (
  id         uuid        primary key default gen_random_uuid(),
  request_id uuid        not null references requests(id) on delete cascade,
  action     text        not null,   -- e.g. 'created', 'status:open→in_progress'
  payload    jsonb,
  user_id    uuid        references users(id) on delete set null,
  created_at timestamptz not null default now()
);
