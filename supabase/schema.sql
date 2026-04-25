-- AlimConnect — Supabase Schema
-- Exécuter dans Supabase Dashboard > SQL Editor

-- 1. Extension UUID
create extension if not exists "uuid-ossp";

-- 2. Profiles (un par utilisateur auth)
create table if not exists profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  role        text not null check (role in ('client', 'seller')),
  first_name  text,
  last_name   text,
  email       text,
  phone       text,
  created_at  timestamptz default now()
);

-- 3. Sellers (profil vendeur, id = profiles.id)
create table if not exists sellers (
  id              uuid references profiles(id) on delete cascade primary key,
  name            text not null,
  type            text check (type in ('supermarché', 'supérette', 'boulangerie', 'épicerie')),
  address         text,
  lat             double precision,
  lng             double precision,
  rating          double precision default 0,
  review_count    int default 0,
  image_url       text,
  payment_method  text check (payment_method in ('wave', 'orange_money')),
  payment_number  text,
  created_at      timestamptz default now()
);

-- 4. Products
create table if not exists products (
  id             uuid default uuid_generate_v4() primary key,
  seller_id      uuid references profiles(id) on delete cascade not null,
  name           text not null,
  description    text,
  original_price numeric not null,
  reduced_price  numeric not null,
  expiry_date    date not null,
  image_url      text,
  category       text,
  quantity       int default 1,
  created_at     timestamptz default now()
);

-- 5. Cart Items
create table if not exists cart_items (
  id         uuid default uuid_generate_v4() primary key,
  user_id    uuid references profiles(id) on delete cascade not null,
  product_id uuid references products(id) on delete cascade not null,
  quantity   int default 1,
  created_at timestamptz default now(),
  unique(user_id, product_id)
);

-- 6. Notifications vendeurs
create table if not exists notifications (
  id         uuid default uuid_generate_v4() primary key,
  seller_id  uuid references profiles(id) on delete cascade not null,
  title      text not null,
  body       text not null,
  read       boolean default false,
  created_at timestamptz default now()
);

-- ── Row Level Security ──────────────────────────────────────────

alter table profiles   enable row level security;
alter table sellers    enable row level security;
alter table products   enable row level security;
alter table cart_items enable row level security;

-- Profiles (lecture publique, écriture sur son propre profil)
create policy "profiles_select_all" on profiles for select using (true);
create policy "profiles_insert_own" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

-- Sellers (lecture publique)
create policy "sellers_select_all"  on sellers for select using (true);
create policy "sellers_insert_own"  on sellers for insert with check (auth.uid() = id);
create policy "sellers_update_own"  on sellers for update using (auth.uid() = id);

-- Products (lecture publique, écriture par le vendeur propriétaire)
create policy "products_select_all"    on products for select using (true);
create policy "products_insert_seller" on products for insert with check (auth.uid() = seller_id);
create policy "products_update_seller" on products for update using (auth.uid() = seller_id);
create policy "products_delete_seller" on products for delete using (auth.uid() = seller_id);

-- Cart
create policy "cart_all_own" on cart_items for all using (auth.uid() = user_id);

-- Notifications
alter table notifications enable row level security;
create policy "notifications_seller_own" on notifications for all using (auth.uid() = seller_id);

-- ── Storage bucket ─────────────────────────────────────────────
-- Dans Supabase Dashboard > Storage :
-- 1. Créer le bucket "product-images" (Public : oui)
-- 2. Ajouter la policy suivante pour l'upload authentifié :
--
-- create policy "Authenticated users can upload product images"
--   on storage.objects for insert
--   with check (bucket_id = 'product-images' and auth.role() = 'authenticated');
--
-- create policy "Public read product images"
--   on storage.objects for select
--   using (bucket_id = 'product-images');
