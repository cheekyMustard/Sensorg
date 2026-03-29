alter table tasks
  add column if not exists is_one_time boolean not null default false;
