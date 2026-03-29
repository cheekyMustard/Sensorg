create table if not exists excursions (
  id                  uuid        primary key default gen_random_uuid(),
  company             text        not null,
  topic               text        not null,
  note                text,
  image_url           text,
  shop_id             uuid        references shops(id) on delete set null,
  created_by_user_id  uuid        references users(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists excursions_shop_id_idx     on excursions(shop_id);
create index if not exists excursions_company_idx     on excursions(company);
create index if not exists excursions_created_at_idx  on excursions(created_at desc);
