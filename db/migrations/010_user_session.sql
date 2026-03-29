-- Migration 010: track last login shop and time for "who's working where today"
alter table users
  add column if not exists last_active_shop_id uuid references shops(id) on delete set null,
  add column if not exists last_seen_at         timestamptz;
