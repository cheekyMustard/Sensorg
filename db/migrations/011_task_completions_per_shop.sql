-- Migration 011: per-shop task completions
-- Each shop now independently marks a task as done for the current period.

alter table task_completions
  add column if not exists shop_id uuid references shops(id) on delete cascade;

-- Drop the old global unique constraint
alter table task_completions
  drop constraint if exists task_completions_task_id_completed_date_key;

-- Legacy rows (shop_id IS NULL): keep unique by task + date
create unique index if not exists task_completions_global_idx
  on task_completions (task_id, completed_date)
  where shop_id is null;

-- New rows (shop_id IS NOT NULL): unique per task + shop + date
create unique index if not exists task_completions_shop_idx
  on task_completions (task_id, shop_id, completed_date)
  where shop_id is not null;
