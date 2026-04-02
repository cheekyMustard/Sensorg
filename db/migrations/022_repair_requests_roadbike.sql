-- Migration 022: add is_roadbike flag to repair_requests
alter table repair_requests add column if not exists is_roadbike boolean not null default false;
