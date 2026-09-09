alter table email_log add column if not exists status text not null default '';
alter table email_log add column if not exists error text not null default '';
