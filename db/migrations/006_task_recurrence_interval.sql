-- Migration 006: split recurrence into unit + interval for flexible cycles
-- Written idempotently so it can safely re-run if partially applied.

do $$
begin
  -- Rename recurrence → recurrence_unit only if old column exists and new one doesn't
  if exists (
    select 1 from information_schema.columns
     where table_name = 'tasks' and column_name = 'recurrence'
  ) and not exists (
    select 1 from information_schema.columns
     where table_name = 'tasks' and column_name = 'recurrence_unit'
  ) then
    alter table tasks rename column recurrence to recurrence_unit;
  end if;

  -- Drop the old recurrence column if both ended up existing
  if exists (
    select 1 from information_schema.columns
     where table_name = 'tasks' and column_name = 'recurrence'
  ) and exists (
    select 1 from information_schema.columns
     where table_name = 'tasks' and column_name = 'recurrence_unit'
  ) then
    alter table tasks drop column recurrence;
  end if;

  -- Drop old check constraint if it still exists
  if exists (
    select 1 from pg_constraint where conname = 'tasks_recurrence_check'
  ) then
    alter table tasks drop constraint tasks_recurrence_check;
  end if;
end $$;

update tasks set recurrence_unit = 'day'   where recurrence_unit = 'daily';
update tasks set recurrence_unit = 'week'  where recurrence_unit = 'weekly';
update tasks set recurrence_unit = 'month' where recurrence_unit = 'monthly';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'tasks_recurrence_unit_check'
  ) then
    alter table tasks add constraint tasks_recurrence_unit_check
      check (recurrence_unit in ('day', 'week', 'month'));
  end if;
end $$;

alter table tasks
  add column if not exists recurrence_interval int not null default 1
    constraint tasks_recurrence_interval_check check (recurrence_interval >= 1);
