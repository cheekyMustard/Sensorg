-- Migration 021: archive support for repair_requests
-- done items stay visible for 2 days then move to archive

alter table repair_requests add column if not exists done_at      timestamptz;
alter table repair_requests add column if not exists is_archived  boolean not null default false;

create index if not exists repair_requests_archived_idx on repair_requests(is_archived);
