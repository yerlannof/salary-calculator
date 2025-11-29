-- =============================================
-- Salary Calculator Database Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create enum types
create type user_role as enum ('seller', 'senior_admin', 'director', 'owner');
create type department as enum ('online', 'tsum');

-- =============================================
-- Users table (linked to Supabase Auth)
-- =============================================
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  role user_role not null default 'seller',
  department department,
  moysklad_employee_id text unique,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.users enable row level security;

-- Users can view their own data
create policy "Users can view own profile"
  on public.users for select
  using (auth.uid() = id);

-- Users can update their own profile (except role)
create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Directors can view users in their department
create policy "Directors can view department users"
  on public.users for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
      and u.role in ('director', 'owner')
    )
  );

-- Owners can manage all users
create policy "Owners can manage all users"
  on public.users for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
      and u.role = 'owner'
    )
  );

-- =============================================
-- Sales cache table (aggregated monthly sales)
-- =============================================
create table public.sales_cache (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  period text not null, -- Format: "2024-01"
  total_sales bigint not null default 0,
  sales_count integer not null default 0,
  updated_at timestamptz default now(),
  unique(user_id, period)
);

-- Enable RLS
alter table public.sales_cache enable row level security;

-- Users can view their own sales
create policy "Users can view own sales cache"
  on public.sales_cache for select
  using (auth.uid() = user_id);

-- Directors can view department sales
create policy "Directors can view department sales cache"
  on public.sales_cache for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
      and u.role in ('director', 'owner')
    )
  );

-- System can insert/update sales cache (via service role)
create policy "Service can manage sales cache"
  on public.sales_cache for all
  using (true)
  with check (true);

-- =============================================
-- Sales details table (individual transactions)
-- =============================================
create table public.sales_details (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  moysklad_id text unique not null,
  date timestamptz not null,
  amount bigint not null,
  customer_name text,
  description text,
  created_at timestamptz default now()
);

-- Index for faster queries
create index idx_sales_details_user_date on public.sales_details(user_id, date);
create index idx_sales_details_moysklad_id on public.sales_details(moysklad_id);

-- Enable RLS
alter table public.sales_details enable row level security;

-- Users can view their own sales details
create policy "Users can view own sales details"
  on public.sales_details for select
  using (auth.uid() = user_id);

-- Directors can view department sales details
create policy "Directors can view department sales details"
  on public.sales_details for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
      and u.role in ('director', 'owner')
    )
  );

-- =============================================
-- Functions
-- =============================================

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.email),
    'seller'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to get current period
create or replace function public.get_current_period()
returns text as $$
begin
  return to_char(now(), 'YYYY-MM');
end;
$$ language plpgsql;
