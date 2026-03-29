alter table notes
  add column if not exists is_done     boolean      not null default false,
  add column if not exists done_at     timestamptz,
  add column if not exists is_archived boolean      not null default false;
