-- Phase 1: multi-role support
-- Replace single `role` text column with `roles text[]`
-- Old roles mapped: manager→organiser, shopUser→general, seller→general, socialmedia→general

alter table users add column if not exists roles text[] not null default '{}';

-- Migrate existing single role to array, mapping obsolete roles to new ones
update users set roles = array[
  case role
    when 'manager'     then 'organiser'
    when 'shopUser'    then 'general'
    when 'seller'      then 'general'
    when 'socialmedia' then 'general'
    else role
  end
];

-- Safety: any row that somehow ended up empty gets 'general'
update users set roles = array['general'] where roles = '{}' or array_length(roles, 1) is null;

-- Drop old single-role column
alter table users drop column role;

-- Constraints: non-empty, only valid roles
alter table users
  add constraint roles_not_empty check (array_length(roles, 1) >= 1),
  add constraint valid_roles     check (roles <@ array['admin','driver','mechanic','cleaner','organiser','general']::text[]);
