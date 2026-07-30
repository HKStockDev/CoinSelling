-- CoinEmpire MVP schema
-- Run in Supabase SQL editor or via supabase db push

create extension if not exists "pgcrypto";

create type public.user_role as enum ('customer', 'admin');
create type public.platform_type as enum ('ps4_ps5', 'xbox', 'pc');
create type public.order_status as enum (
  'pending_payment',
  'paid',
  'processing',
  'delivered',
  'cancelled',
  'refunded'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role public.user_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  coin_amount bigint not null,
  bonus_coins bigint not null default 0,
  -- prices in GBP minor units (pence) so seasonal edits stay precise
  price_gbp_pence integer not null,
  compare_at_gbp_pence integer,
  platform public.platform_type not null default 'ps4_ps5',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_active_sort_idx on public.products (is_active, sort_order, coin_amount);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid references public.profiles(id) on delete set null,
  guest_email text,
  status public.order_status not null default 'pending_payment',
  platform public.platform_type not null,
  subtotal_gbp_pence integer not null,
  total_gbp_pence integer not null,
  currency text not null default 'gbp',
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  delivery_notes text,
  game_account_email text,
  customer_whatsapp text,
  admin_notes text,
  paid_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_user_idx on public.orders (user_id, created_at desc);
create index orders_status_idx on public.orders (status, created_at desc);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  coin_amount bigint not null,
  bonus_coins bigint not null default 0,
  unit_price_gbp_pence integer not null,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now()
);

create table public.price_history (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  old_price_gbp_pence integer not null,
  new_price_gbp_pence integer not null,
  changed_by uuid references public.profiles(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'customer')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();
create trigger products_updated_at before update on public.products
  for each row execute procedure public.set_updated_at();
create trigger orders_updated_at before update on public.orders
  for each row execute procedure public.set_updated_at();

-- RLS
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.price_history enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

create policy "Profiles: users read own" on public.profiles
  for select using (auth.uid() = id or public.is_admin());
create policy "Profiles: users update own" on public.profiles
  for update using (auth.uid() = id or public.is_admin());

create policy "Products: anyone read active" on public.products
  for select using (is_active = true or public.is_admin());
create policy "Products: admin write" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Orders: users read own" on public.orders
  for select using (auth.uid() = user_id or public.is_admin());
create policy "Orders: users insert own" on public.orders
  for insert with check (auth.uid() = user_id or public.is_admin());
create policy "Orders: admin update" on public.orders
  for update using (public.is_admin());

create policy "Order items: via order access" on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())
    )
  );
create policy "Order items: insert with order" on public.order_items
  for insert with check (
    exists (
      select 1 from public.orders o
      where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())
    )
  );

create policy "Price history: admin only" on public.price_history
  for all using (public.is_admin()) with check (public.is_admin());
