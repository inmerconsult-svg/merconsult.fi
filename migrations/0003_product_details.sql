alter table products add column if not exists image_url text;
alter table products add column if not exists datasheet_url text;
alter table products add column if not exists features_fi text not null default '[]';
alter table products add column if not exists features_en text not null default '[]';
alter table products add column if not exists features_sv text not null default '[]';
alter table products add column if not exists features_no text not null default '[]';
alter table products add column if not exists features_et text not null default '[]';
