-- Shops
insert into shops (id, name) values
  ('00000000-0000-0000-0000-000000000001', 'Arcos'),
  ('00000000-0000-0000-0000-000000000002', 'THB'),
  ('00000000-0000-0000-0000-000000000003', 'Plaza')
on conflict do nothing;

-- Admin user  (password: admin123  — change before production)
-- bcrypt hash of 'admin123' with cost 10
insert into users (id, username, password_hash, role, shop_id) values
  (
    '00000000-0000-0000-0000-000000000010',
    'admin',
    '$2a$10$KpOCXpCK0zLIxNKj22jdR.j4P74THHvimSImShGUEcZ/oe7RdwEkG',
    'admin',
    null
  )
on conflict (username) do nothing;

-- Example bikes
insert into bikes (label) values
  ('TREK-001'),
  ('GIANT-042'),
  ('CANYON-007')
on conflict (label) do nothing;
