-- Migration 003: notes per shop

create table if not exists notes (
  id                  uuid        primary key default gen_random_uuid(),
  shop_id             uuid        references shops(id) on delete cascade,  -- null = global
  title               text        not null,
  content             text        not null default '',
  created_by_user_id  uuid        references users(id) on delete set null,
  updated_by_user_id  uuid        references users(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists notes_shop_id_idx on notes(shop_id);
