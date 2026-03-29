-- Migration 005: add recurrence cycle to tasks

alter table tasks
  add column if not exists recurrence text not null default 'daily'
    constraint tasks_recurrence_check check (recurrence in ('daily', 'weekly', 'monthly'));
