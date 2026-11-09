-- Pre-Loved Thrift - PostgreSQL schema for Supabase
-- Run this in the Supabase SQL editor, or with `supabase db push`.
-- The app uses Supabase Auth for sessions and the tables below for application data.
--
-- Roles:
--   buyer  - shopping, cart, wishlist, own orders
--   seller - inventory, all orders, rider assignment, order status
--   rider  - only orders assigned to the signed-in rider
--
-- All money columns are PHP amounts.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  role text not null default 'buyer' check (role in ('buyer', 'seller', 'rider')),
  role_locked boolean not null default false,
  phone text,
  address text,
  avatar text,
  inventory_seeded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists inventory_seeded boolean not null default false;

-- Curated storefront products that are shipped with the app. Seller-owned
-- products live in public.products instead.
create table if not exists public.house_products (
  product_key text primary key,
  name text not null,
  price numeric(12, 2) not null check (price >= 0),
  image text,
  category text,
  type text,
  slot text,
  fit jsonb,
  active boolean not null default true
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  category text not null,
  type text,
  price numeric(12, 2) not null check (price > 0),
  stock integer not null default 0 check (stock >= 0),
  reorder_point integer not null default 3 check (reorder_point >= 0),
  auto_reorder boolean not null default false,
  color text,
  image text,
  sold integer not null default 0 check (sold >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_key text not null,
  product_id uuid references public.products(id) on delete set null,
  name text not null,
  price numeric(12, 2) not null check (price >= 0),
  image text,
  selected boolean not null default true,
  size text not null default '',
  note text,
  cat text,
  type text,
  slot text,
  fit jsonb,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, product_key, size)
);

create table if not exists public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_key text not null,
  product_id uuid references public.products(id) on delete set null,
  name text not null,
  price numeric(12, 2) not null check (price >= 0),
  image text,
  cat text,
  type text,
  slot text,
  fit jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, product_key)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  buyer_name text not null,
  buyer_email text not null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  customer_address text not null,
  payment text not null check (payment in ('GCash', 'Cash on delivery')),
  payment_proof text,
  status text not null default 'Pending'
    check (status in ('Pending', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'Delivered', 'Cancelled')),
  subtotal numeric(12, 2) not null default 0 check (subtotal >= 0),
  shipping numeric(12, 2) not null default 0 check (shipping >= 0),
  total numeric(12, 2) not null default 0 check (total >= 0),
  rider_id uuid references public.profiles(id) on delete set null,
  rider_name text,
  rider_email text,
  rider_phone text,
  delivered_item_indexes integer[] not null default '{}',
  delivery_proof text,
  delivery_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_key text not null,
  product_id uuid references public.products(id) on delete set null,
  name text not null,
  price numeric(12, 2) not null check (price >= 0),
  image text,
  size text not null default '',
  note text,
  cat text,
  type text,
  slot text,
  fit jsonb,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.order_messages (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  sender text not null check (sender in ('rider', 'customer')),
  sender_id uuid references public.profiles(id) on delete set null,
  text text not null check (char_length(text) between 1 and 500),
  created_at timestamptz not null default now()
);

create table if not exists public.seller_activity (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  detail text,
  created_at timestamptz not null default now()
);

create index if not exists products_seller_id_idx on public.products(seller_id);
create index if not exists cart_items_user_id_idx on public.cart_items(user_id);
create index if not exists wishlist_items_user_id_idx on public.wishlist_items(user_id);
create index if not exists orders_buyer_id_idx on public.orders(buyer_id);
create index if not exists orders_rider_id_idx on public.orders(rider_id);
create index if not exists order_items_order_id_idx on public.order_items(order_id);
create index if not exists order_messages_order_id_idx on public.order_messages(order_id);
create index if not exists seller_activity_seller_id_idx on public.seller_activity(seller_id);

-- ---------------------------------------------------------------------------
-- Seed the curated storefront catalogue
-- ---------------------------------------------------------------------------

insert into public.house_products (product_key, name, price, image, category, type, slot, fit)
values
  ('1', 'Burgundy Ruched Gown', 2088, '/product%20category/Burgundy%20Ruched%20Gown.png', 'Women', 'Clothing', 'dress', '{"imageWidth":736,"imageHeight":1104,"left":176,"top":61,"right":578,"bottom":1090}'::jsonb),
  ('2', 'COMBRAIDED Men’s Textured Polo', 1624, '/product%20category/COMBRAIDED%20Men%E2%80%99s%20Textured%20Polo%20T-Shirt%20_%20Polycotton%20Regular%20Fit%20_%20Casual%20&%20Stylish%20Daily%20Wear.png', 'Men', 'Clothing', 'top', '{"imageWidth":736,"imageHeight":1104,"left":11,"top":102,"right":730,"bottom":930}'::jsonb),
  ('3', 'Deck Shoes', 1914, '/product%20category/Deck%20Shoes.png', 'Shoes', 'Shoes', 'shoes', '{"imageWidth":736,"imageHeight":1104,"left":61,"top":141,"right":682,"bottom":963}'::jsonb),
  ('4', 'Elegant Women’s Handbag', 2436, '/product%20category/Elegant%20Women%27s%20Handbag%20with%20Gold%20Buckle.png', 'Accessories', 'Bag', null, null),
  ('5', 'French High-Heeled Women’s Shoes', 2262, '/product%20category/French%20High-Heeled%20Women%27s%20Shoes%202025%20New%20Summer%20Fairy%20Style%20Temperament%20Black%20Fine%20Roman%20-%20Upgraded%20(White)%20_%2040.png', 'Shoes', 'Shoes', 'shoes', '{"imageWidth":736,"imageHeight":736,"left":6,"top":40,"right":730,"bottom":697}'::jsonb),
  ('6', 'Jack & Jones Straight Leg Jeans', 1740, '/product%20category/Jack%20&%20Jones%20gy%20fit%20JJIALEX%20JJNORREBRO%20SQ%20400%20LN%20-%20Straight%20leg%20jeans%20-%20blue%20denim.png', 'Denim', 'Clothing', 'bottom', '{"imageWidth":735,"imageHeight":1059,"left":162,"top":68,"right":573,"bottom":992}'::jsonb)
on conflict (product_key) do nothing;

-- ---------------------------------------------------------------------------
-- Functions and triggers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists set_cart_items_updated_at on public.cart_items;
create trigger set_cart_items_updated_at before update on public.cart_items
for each row execute function public.set_updated_at();

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at before update on public.orders
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text;
  resolved_role text;
  locked boolean;
begin
  requested_role := coalesce(new.raw_user_meta_data ->> 'role', '');

  if requested_role in ('buyer', 'seller', 'rider') then
    resolved_role := requested_role;
    locked := true;
  else
    resolved_role := 'buyer';
    locked := false;
  end if;

  insert into public.profiles (id, email, full_name, role, role_locked, phone, address, avatar)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    resolved_role,
    locked,
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    nullif(new.raw_user_meta_data ->> 'address', ''),
    nullif(coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture'), '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Backfill auth users that existed before this migration.
insert into public.profiles (id, email, full_name, role, role_locked)
select id, coalesce(email, ''), coalesce(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'name', ''), 'buyer', false
from auth.users
on conflict (id) do nothing;

create or replace function public.set_my_role(new_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if new_role not in ('buyer', 'seller', 'rider') then
    raise exception 'Invalid role.' using errcode = '22023';
  end if;

  update public.profiles
     set role = new_role,
         role_locked = true
   where id = auth.uid()
     and role_locked = false;

  if not found then
    raise exception 'This account already has a role.' using errcode = 'P0001';
  end if;
end;
$$;

create or replace function public.seed_my_seller_inventory()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  seller public.profiles%rowtype;
begin
  select * into seller from public.profiles where id = auth.uid() for update;
  if not found or seller.role <> 'seller' then
    raise exception 'Only seller accounts can seed inventory.' using errcode = '42501';
  end if;
  if seller.inventory_seeded then
    return;
  end if;

  insert into public.products (
    seller_id, name, category, type, price, stock, reorder_point,
    auto_reorder, color, image, sold, active
  )
  select
    auth.uid(),
    hp.name,
    case hp.category
      when 'Women' then 'Women Dresses'
      when 'Men' then 'Tops & T-shirts'
      when 'Shoes' then 'Shoes & Footwear'
      when 'Accessories' then 'Bags & Accessories'
      when 'Denim' then 'Denim Wear'
      else hp.category
    end,
    hp.type,
    hp.price,
    case hp.product_key
      when '1' then 12
      when '2' then 8
      when '3' then 3
      when '4' then 1
      when '5' then 2
      else 5
    end,
    3,
    false,
    '',
    hp.image,
    0,
    true
  from public.house_products hp
  where hp.active
  order by hp.product_key;

  update public.profiles
     set inventory_seeded = true
   where id = auth.uid();
end;
$$;

create or replace function public.order_has_items(p_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.order_items where order_id = p_order_id
  )
$$;

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_seller()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'seller'
  )
$$;

create or replace function public.is_rider()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'rider'
  )
$$;

create or replace function public.prepare_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  buyer public.profiles%rowtype;
begin
  select * into buyer from public.profiles where id = new.buyer_id;
  if not found then
    raise exception 'Buyer profile not found.' using errcode = 'P0001';
  end if;

  new.buyer_name := buyer.full_name;
  new.buyer_email := buyer.email;
  new.customer_name := coalesce(nullif(btrim(new.customer_name), ''), buyer.full_name);
  new.customer_email := coalesce(nullif(btrim(new.customer_email), ''), buyer.email);
  new.status := 'Pending';
  new.subtotal := 0;
  new.shipping := 0;
  new.total := 0;
  new.rider_id := null;
  new.rider_name := null;
  new.rider_email := null;
  new.rider_phone := null;
  new.delivered_item_indexes := '{}';
  new.delivery_proof := null;
  new.delivery_completed_at := null;
  if new.payment <> 'GCash' then
    new.payment_proof := null;
  end if;
  return new;
end;
$$;

drop trigger if exists prepare_orders_before_insert on public.orders;
create trigger prepare_orders_before_insert before insert on public.orders
for each row execute function public.prepare_order();

-- Only fulfilment fields may be changed after an order is placed.
create or replace function public.guard_order_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_setting('app.internal_order_update', true) = 'on'
     or current_setting('app.internal_rider_sync', true) = 'on' then
    return new;
  end if;

  if public.is_seller() then
    -- Sellers may update status, rider assignment, and delivery fields only.
    if (to_jsonb(new) - 'status' - 'rider_id' - 'rider_name' - 'rider_email' - 'rider_phone' - 'delivered_item_indexes' - 'delivery_proof' - 'delivery_completed_at' - 'updated_at')
       is distinct from
       (to_jsonb(old) - 'status' - 'rider_id' - 'rider_name' - 'rider_email' - 'rider_phone' - 'delivered_item_indexes' - 'delivery_proof' - 'delivery_completed_at' - 'updated_at') then
      raise exception 'Sellers may only update fulfilment fields.' using errcode = '42501';
    end if;
  elsif public.is_rider() then
    if new.rider_id is distinct from old.rider_id then
      raise exception 'Riders cannot reassign orders.' using errcode = '42501';
    end if;
    if (new.rider_name is distinct from old.rider_name
        or new.rider_email is distinct from old.rider_email
        or new.rider_phone is distinct from old.rider_phone)
       and coalesce(current_setting('app.internal_rider_sync', true), '') <> 'on' then
      raise exception 'Riders cannot edit their order contact snapshot.' using errcode = '42501';
    end if;
    if (to_jsonb(new) - 'status' - 'rider_name' - 'rider_email' - 'rider_phone' - 'delivered_item_indexes' - 'delivery_proof' - 'delivery_completed_at' - 'updated_at')
       is distinct from
       (to_jsonb(old) - 'status' - 'rider_name' - 'rider_email' - 'rider_phone' - 'delivered_item_indexes' - 'delivery_proof' - 'delivery_completed_at' - 'updated_at') then
      raise exception 'Riders may only update delivery fields.' using errcode = '42501';
    end if;
  else
    raise exception 'Only sellers and assigned riders can update orders.' using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_orders_update on public.orders;
create trigger guard_orders_update before update on public.orders
for each row execute function public.guard_order_update();

-- Keep rider snapshots on orders in sync with the rider profile.
create or replace function public.sync_rider_snapshot()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role = 'rider' then
    perform set_config('app.internal_rider_sync', 'on', true);
    update public.orders
       set rider_name = new.full_name,
           rider_email = new.email,
           rider_phone = new.phone
     where rider_id = new.id;
    perform set_config('app.internal_rider_sync', 'off', true);
  end if;
  return new;
end;
$$;

drop trigger if exists sync_rider_snapshot_on_profile on public.profiles;
create trigger sync_rider_snapshot_on_profile
after update of full_name, email, phone on public.profiles
for each row execute function public.sync_rider_snapshot();

-- Validate order item snapshots against the catalogue so a client cannot
-- change prices or buy an inactive product by editing the request payload.
create or replace function public.validate_order_item()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  product public.products%rowtype;
  house public.house_products%rowtype;
begin
  if new.product_id is not null then
    select * into product from public.products where id = new.product_id;
    if not found or not product.active then
      raise exception 'This product is not available.' using errcode = 'P0001';
    end if;
    if product.stock < new.quantity then
      raise exception 'Not enough stock for %.', product.name using errcode = 'P0001';
    end if;
    new.name := product.name;
    new.price := product.price;
    new.image := product.image;
    new.cat := product.category;
    new.type := product.type;
    new.slot := null;
    new.fit := null;
  else
    select * into house from public.house_products where product_key = new.product_key and active;
    if not found then
      raise exception 'This product is not available.' using errcode = 'P0001';
    end if;
    new.name := house.name;
    new.price := house.price;
    new.image := house.image;
    new.cat := house.category;
    new.type := house.type;
    new.slot := house.slot;
    new.fit := house.fit;
  end if;
  return new;
end;
$$;

drop trigger if exists validate_order_items_before_insert on public.order_items;
create trigger validate_order_items_before_insert before insert on public.order_items
for each row execute function public.validate_order_item();

-- Decrement stock, increment units sold, and apply auto-reorder.
create or replace function public.apply_order_item_stock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.product_id is not null then
    update public.products
       set stock = greatest(stock - new.quantity, 0),
           sold = sold + new.quantity
     where id = new.product_id;
  end if;
  return new;
end;
$$;

drop trigger if exists after_order_items_stock on public.order_items;
create trigger after_order_items_stock after insert on public.order_items
for each row execute function public.apply_order_item_stock();

create or replace function public.apply_product_auto_reorder()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.auto_reorder
     and new.stock <= new.reorder_point
     and new.stock <> new.reorder_point + 10 then
    update public.products
       set stock = new.reorder_point + 10
     where id = new.id
       and stock = new.stock;
  end if;

  return new;
end;
$$;

drop trigger if exists after_product_auto_reorder_enabled on public.products;
create trigger after_product_auto_reorder_enabled on public.products
after update of stock, auto_reorder, reorder_point on public.products
for each row
when (new.auto_reorder and new.stock <= new.reorder_point)
execute function public.apply_product_auto_reorder();

-- Recalculate order totals on the server from the validated line items.
create or replace function public.apply_order_totals()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  next_subtotal numeric(12, 2);
  next_shipping numeric(12, 2);
begin
  select coalesce(sum(price * quantity), 0)
    into next_subtotal
    from public.order_items
   where order_id = new.order_id;

  next_shipping := case when next_subtotal >= 2900 then 0 else 261 end;

  perform set_config('app.internal_order_update', 'on', true);
  update public.orders
     set subtotal = next_subtotal,
         shipping = next_shipping,
         total = next_subtotal + next_shipping
   where id = new.order_id;
  perform set_config('app.internal_order_update', 'off', true);

  return new;
end;
$$;

drop trigger if exists after_order_items_totals on public.order_items;
create trigger after_order_items_totals after insert on public.order_items
for each row execute function public.apply_order_totals();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.house_products enable row level security;
alter table public.products enable row level security;
alter table public.cart_items enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_messages enable row level security;
alter table public.seller_activity enable row level security;

-- profiles
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
for select to authenticated
using (id = auth.uid());

drop policy if exists profiles_select_riders on public.profiles;
create policy profiles_select_riders on public.profiles
for select to authenticated
using (public.is_seller() and role = 'rider');

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- house_products (read-only catalogue)
drop policy if exists house_products_select on public.house_products;
create policy house_products_select on public.house_products
for select to authenticated
using (active = true);

-- products
drop policy if exists products_select on public.products;
create policy products_select on public.products
for select to authenticated
using (active = true or seller_id = auth.uid() or public.is_seller());

drop policy if exists products_insert on public.products;
create policy products_insert on public.products
for insert to authenticated
with check (seller_id = auth.uid() and public.is_seller());

drop policy if exists products_update on public.products;
create policy products_update on public.products
for update to authenticated
using (seller_id = auth.uid() and public.is_seller())
with check (seller_id = auth.uid() and public.is_seller());

drop policy if exists products_delete on public.products;
create policy products_delete on public.products
for delete to authenticated
using (seller_id = auth.uid() and public.is_seller());

-- cart_items
drop policy if exists cart_items_select on public.cart_items;
create policy cart_items_select on public.cart_items for select to authenticated
using (user_id = auth.uid());

drop policy if exists cart_items_insert on public.cart_items;
create policy cart_items_insert on public.cart_items for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists cart_items_update on public.cart_items;
create policy cart_items_update on public.cart_items for update to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists cart_items_delete on public.cart_items;
create policy cart_items_delete on public.cart_items for delete to authenticated
using (user_id = auth.uid());

-- wishlist_items
drop policy if exists wishlist_items_select on public.wishlist_items;
create policy wishlist_items_select on public.wishlist_items for select to authenticated
using (user_id = auth.uid());

drop policy if exists wishlist_items_insert on public.wishlist_items;
create policy wishlist_items_insert on public.wishlist_items for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists wishlist_items_update on public.wishlist_items;
create policy wishlist_items_update on public.wishlist_items for update to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists wishlist_items_delete on public.wishlist_items;
create policy wishlist_items_delete on public.wishlist_items for delete to authenticated
using (user_id = auth.uid());

-- orders
drop policy if exists orders_select on public.orders;
create policy orders_select on public.orders for select to authenticated
using (
  buyer_id = auth.uid()
  or public.is_seller()
  or (public.is_rider() and rider_id = auth.uid())
);

drop policy if exists orders_insert on public.orders;
create policy orders_insert on public.orders for insert to authenticated
with check (buyer_id = auth.uid() and public.current_user_role() = 'buyer');

drop policy if exists orders_update on public.orders;
create policy orders_update on public.orders for update to authenticated
using (public.is_seller() or (public.is_rider() and rider_id = auth.uid()))
with check (public.is_seller() or (public.is_rider() and rider_id = auth.uid()));

-- Allows the client to remove a just-created order if its line-item insert was
-- rejected. Orders that have items can never be deleted by buyers.
drop policy if exists orders_delete_empty on public.orders;
create policy orders_delete_empty on public.orders for delete to authenticated
using (
  buyer_id = auth.uid()
  and status = 'Pending'
  and not public.order_has_items(id)
);

-- order_items: access follows the parent order. Inserts happen while a buyer
-- places an order; the validation trigger overwrites catalogue-controlled data.
drop policy if exists order_items_select on public.order_items;
create policy order_items_select on public.order_items for select to authenticated
using (
  exists (
    select 1 from public.orders o
    where o.id = order_id
      and (o.buyer_id = auth.uid() or public.is_seller() or (public.is_rider() and o.rider_id = auth.uid()))
  )
);

drop policy if exists order_items_insert on public.order_items;
create policy order_items_insert on public.order_items for insert to authenticated
with check (
  exists (
    select 1 from public.orders o
    where o.id = order_id and o.buyer_id = auth.uid()
  )
);

-- order_messages
drop policy if exists order_messages_select on public.order_messages;
create policy order_messages_select on public.order_messages for select to authenticated
using (
  exists (
    select 1 from public.orders o
    where o.id = order_id
      and (o.buyer_id = auth.uid() or public.is_seller() or (public.is_rider() and o.rider_id = auth.uid()))
  )
);

drop policy if exists order_messages_insert on public.order_messages;
create policy order_messages_insert on public.order_messages for insert to authenticated
with check (
  sender_id = auth.uid()
  and (
    (sender = 'customer' and exists (
      select 1 from public.orders o where o.id = order_id and o.buyer_id = auth.uid()
    ))
    or
    (sender = 'rider' and exists (
      select 1 from public.orders o where o.id = order_id and o.rider_id = auth.uid()
    ))
  )
);

-- seller_activity
drop policy if exists seller_activity_select on public.seller_activity;
create policy seller_activity_select on public.seller_activity for select to authenticated
using (seller_id = auth.uid() and public.is_seller());

drop policy if exists seller_activity_insert on public.seller_activity;
create policy seller_activity_insert on public.seller_activity for insert to authenticated
with check (seller_id = auth.uid() and public.is_seller());

-- ---------------------------------------------------------------------------
-- Privileges
-- ---------------------------------------------------------------------------

grant usage on schema public to authenticated;

grant select on public.house_products to authenticated;
grant select, insert, update, delete on public.products to authenticated;
grant select, insert, update, delete on public.cart_items to authenticated;
grant select, insert, update, delete on public.wishlist_items to authenticated;
grant select, insert, update, delete on public.orders to authenticated;
grant select, insert on public.order_items to authenticated;
grant select, insert on public.order_messages to authenticated;
grant select, insert on public.seller_activity to authenticated;

grant select on public.profiles to authenticated;
-- Role and role_locked are intentionally not grantable to clients.
revoke update on public.profiles from authenticated;
grant update (full_name, phone, address, avatar) on public.profiles to authenticated;
revoke insert, delete on public.profiles from authenticated;

revoke all on public.house_products from anon;
revoke all on public.products from anon;
revoke all on public.cart_items from anon;
revoke all on public.wishlist_items from anon;
revoke all on public.orders from anon;
revoke all on public.order_items from anon;
revoke all on public.order_messages from anon;
revoke all on public.seller_activity from anon;
revoke all on public.profiles from anon;

revoke all on function public.set_my_role(text) from public;
grant execute on function public.set_my_role(text) to authenticated;
revoke all on function public.seed_my_seller_inventory() from public;
grant execute on function public.seed_my_seller_inventory() to authenticated;
revoke all on function public.order_has_items(uuid) from public;
grant execute on function public.order_has_items(uuid) to authenticated;
revoke all on function public.current_user_role() from public;
grant execute on function public.current_user_role() to authenticated;
revoke all on function public.is_seller() from public;
grant execute on function public.is_seller() to authenticated;
revoke all on function public.is_rider() from public;
grant execute on function public.is_rider() to authenticated;
