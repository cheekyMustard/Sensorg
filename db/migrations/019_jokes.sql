-- Migration 019: joke collection

create table if not exists joke_categories (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null unique,
  created_at timestamptz not null default now()
);

create table if not exists jokes (
  id                  uuid        primary key default gen_random_uuid(),
  content             text,
  image_url           text,
  category            text,
  created_by_user_id  uuid        references users(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint jokes_has_content check (content is not null or image_url is not null)
);

create index if not exists jokes_category_idx on jokes(category);
create index if not exists jokes_created_at_idx on jokes(created_at desc);
