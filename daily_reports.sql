
create table if not exists daily_reports (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  date date not null,
  total_invested numeric,
  current_value numeric,
  metrics jsonb, -- Stores Top Movers { winners: [], losers: [] }
  operations jsonb, -- Stores Daily Ops { buys: [], sells: [] }
  created_at timestamptz default now(),
  unique(user_id, date)
);

alter table daily_reports enable row level security;

-- Policy to view own reports
create policy "Users can view their own reports"
on daily_reports for select
using (auth.uid() = user_id);

-- Policy to insert own reports
create policy "Users can insert their own reports"
on daily_reports for insert
with check (auth.uid() = user_id);

-- Policy to update own reports
create policy "Users can update their own reports"
on daily_reports for update
using (auth.uid() = user_id);
