-- Migration 016: repair requests (auto-created when a repair delivery reaches done)

create table if not exists repair_requests (
  id                      uuid        primary key default gen_random_uuid(),
  shop_id                 uuid        references shops(id) on delete cascade,
  bike_labels             text[]      not null default '{}',
  arrival_date            date        not null,
  problem_description     text,
  status                  text        not null default 'open'
                            check (status in ('open', 'in_progress', 'done')),
  taken_by_user_id        uuid        references users(id) on delete set null,
  created_from_request_id uuid        references requests(id) on delete set null,
  created_by_user_id      uuid        references users(id) on delete set null,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index if not exists repair_requests_shop_id_idx  on repair_requests(shop_id);
create index if not exists repair_requests_status_idx   on repair_requests(status);
