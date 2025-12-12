-- 1. Create PROFILES table (Stores capital)
create table profiles (
  id uuid references auth.users not null primary key,
  capital numeric default 0,
  updated_at timestamp with time zone
);

-- 2. Create INVESTMENTS table
create table investments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  symbol text not null,
  name text,
  type text not null,
  quantity numeric not null,
  buy_price numeric not null,
  current_price numeric,
  total_invested numeric not null,
  purchase_date date not null,
  status text default 'Active',
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create TRANSACTIONS table
create table transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  type text not null,
  amount numeric not null,
  date date not null,
  description text,
  investment_id uuid references investments,
  price_per_unit numeric,
  quantity numeric,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Enable Row Level Security (RLS) - Security Policies
alter table profiles enable row level security;
alter table investments enable row level security;
alter table transactions enable row level security;

-- Policies for Profiles
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

-- Policies for Investments
create policy "Users can view own investments" on investments for select using (auth.uid() = user_id);
create policy "Users can insert own investments" on investments for insert with check (auth.uid() = user_id);
create policy "Users can update own investments" on investments for update using (auth.uid() = user_id);
create policy "Users can delete own investments" on investments for delete using (auth.uid() = user_id);

-- Policies for Transactions
create policy "Users can view own transactions" on transactions for select using (auth.uid() = user_id);
create policy "Users can insert own transactions" on transactions for insert with check (auth.uid() = user_id);

-- 5. Auto-create profile on signup Trigger
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, capital)
  values (new.id, 0);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
