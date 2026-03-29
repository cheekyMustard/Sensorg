-- Migration 008: optional free-text note on delivery requests
alter table requests add column if not exists note text null;
