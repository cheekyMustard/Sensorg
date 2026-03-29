-- Migration 009: track whether the person who took a job has blocked transport in BRM
alter table requests add column if not exists brm_blocked boolean not null default false;
