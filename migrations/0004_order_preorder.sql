alter table order_items add column if not exists preorder boolean not null default false;
