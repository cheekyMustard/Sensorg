-- Migration 004: recurring tasks per shop

create table if not exists tasks (
  id                  uuid        primary key default gen_random_uuid(),
  shop_id             uuid        references shops(id) on delete cascade,  -- null = all shops
  title               text        not null,
  description         text        not null default '',
  is_active           boolean     not null default true,
  created_by_user_id  uuid        references users(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists tasks_shop_id_idx on tasks(shop_id);

create table if not exists task_completions (
  id                    uuid        primary key default gen_random_uuid(),
  task_id               uuid        not null references tasks(id) on delete cascade,
  completed_by_user_id  uuid        references users(id) on delete set null,
  completed_date        date        not null default current_date,
  completed_at          timestamptz not null default now(),

  unique (task_id, completed_date)   -- one completion per task per day
);

create index if not exists task_completions_task_id_idx      on task_completions(task_id);
create index if not exists task_completions_date_idx         on task_completions(completed_date);
