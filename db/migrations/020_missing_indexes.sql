-- Migration 020: add missing indexes on frequently-queried FK columns

-- requests: both shop columns appear in WHERE and JOIN clauses on every list query
create index if not exists requests_from_shop_id_idx on requests(from_shop_id);
create index if not exists requests_to_shop_id_idx   on requests(to_shop_id);

-- notes: shop_id is filtered in every GET; created_by_user_id used in archive JOIN
create index if not exists notes_shop_id_idx             on notes(shop_id);
create index if not exists notes_created_by_user_id_idx  on notes(created_by_user_id);

-- task_completions: completed_by_user_id used in JOIN for per-user completion queries
create index if not exists task_completions_completed_by_user_id_idx on task_completions(completed_by_user_id);
