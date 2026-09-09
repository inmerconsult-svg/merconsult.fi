create table if not exists profiles (
  user_id text primary key,
  email text not null default '',
  display_name text not null default '',
  role text not null default 'customer',
  company_name text not null default '',
  vat_number text not null default '',
  phone text not null default '',
  address_line text not null default '',
  postal_code text not null default '',
  city text not null default '',
  country text not null default 'FI',
  language text not null default 'fi',
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

create table if not exists products (
  sku text primary key,
  ean text,
  name_fi text not null,
  name_en text not null default '',
  name_sv text not null default '',
  name_no text not null default '',
  name_et text not null default '',
  category_code text not null,
  category_fi text not null,
  category_en text not null default '',
  category_sv text not null default '',
  category_no text not null default '',
  category_et text not null default '',
  product_group text not null default 'kitchen',
  net_price numeric(12,2) not null default 0,
  carton_qty integer not null default 1,
  stock integer not null default 0,
  incoming integer not null default 0,
  reserved integer not null default 0,
  backorder integer not null default 0,
  eta text,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

create index if not exists products_group_idx on products (product_group);
create index if not exists products_category_idx on products (category_code);
create index if not exists products_active_idx on products (active);

create table if not exists orders (
  id serial primary key,
  order_no text unique not null,
  user_id text not null,
  status text not null default 'submitted',
  company_name text not null default '',
  vat_number text not null default '',
  email text not null default '',
  phone text not null default '',
  po_number text not null default '',
  notes text not null default '',
  delivery_name text not null default '',
  delivery_address text not null default '',
  delivery_postal text not null default '',
  delivery_city text not null default '',
  delivery_country text not null default 'FI',
  reverse_charge boolean not null default false,
  net_total numeric(12,2) not null default 0,
  vat_rate numeric(6,2) not null default 25.5,
  vat_total numeric(12,2) not null default 0,
  grand_total numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_user_idx on orders (user_id);
create index if not exists orders_status_idx on orders (status);

create table if not exists order_items (
  id serial primary key,
  order_id integer not null references orders(id) on delete cascade,
  sku text not null,
  name text not null,
  ean text,
  qty integer not null,
  carton_qty integer not null default 1,
  unit_price numeric(12,2) not null,
  line_total numeric(12,2) not null
);

create index if not exists order_items_order_idx on order_items (order_id);

create table if not exists settings (
  key text primary key,
  value text not null
);

create table if not exists import_logs (
  id serial primary key,
  user_id text not null,
  filename text not null default '',
  products_updated integer not null default 0,
  products_added integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists email_log (
  id serial primary key,
  order_id integer,
  to_address text not null,
  subject text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists favorites (
  user_id text not null,
  sku text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, sku)
);

insert into settings (key, value) values
  ('order_email', 'barmanol@gmail.com'),
  ('company_name', 'Inbound Finland Oy'),
  ('vat_rate', '25.5'),
  ('brand_name', 'Prego')
on conflict (key) do nothing;
