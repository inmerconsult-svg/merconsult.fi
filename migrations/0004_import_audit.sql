alter table import_logs add column if not exists actor_email text not null default '';
alter table import_logs add column if not exists products_deactivated integer not null default 0;
alter table import_logs add column if not exists products_changed integer not null default 0;
alter table import_logs add column if not exists deactivate_missing boolean not null default false;
alter table import_logs add column if not exists details text not null default '{}';
