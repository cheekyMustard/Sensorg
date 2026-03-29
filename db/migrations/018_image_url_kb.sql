-- Migration 018: add image_url to kb_articles
alter table kb_articles
  add column if not exists image_url text;
