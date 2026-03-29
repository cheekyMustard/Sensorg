-- Migration 002: push_subscriptions + bikes.current_shop_id

-- Track current physical location of each bike
alter table bikes
  add column if not exists current_shop_id uuid references shops(id) on delete set null;

-- Store Web Push subscriptions per user/device
create table if not exists push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  endpoint   text not null,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

create index if not exists push_subscriptions_user_id_idx on push_subscriptions(user_id);
