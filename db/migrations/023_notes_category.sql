-- Migration 023: add category to notes
alter table notes add column if not exists category text
  check (category in ('need_stuff', 'information', 'other'));
