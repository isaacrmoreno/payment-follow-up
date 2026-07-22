create table if not exists public.user_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  business_name text,
  reply_to_email text,
  timezone text not null default 'America/Los_Angeles',
  reminder_cadence text not null default 'manual',
  follow_up_interval_days integer not null default 3,
  soft_reminder_days integer not null default 0,
  firm_reminder_days integer not null default 7,
  final_reminder_days integer not null default 14,
  reminder_send_time text not null default '08:30',
  invoice_footer text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_preferences
  add column if not exists soft_reminder_days integer not null default 0,
  add column if not exists firm_reminder_days integer not null default 7,
  add column if not exists final_reminder_days integer not null default 14,
  add column if not exists reminder_send_time text not null default '08:30';

grant usage on schema public to authenticated;
grant select, insert, update on public.user_preferences to authenticated;

alter table public.user_preferences enable row level security;

drop policy if exists "user_preferences_select_own" on public.user_preferences;
create policy "user_preferences_select_own"
  on public.user_preferences for select
  using (auth.uid() = user_id);

drop policy if exists "user_preferences_insert_own" on public.user_preferences;
create policy "user_preferences_insert_own"
  on public.user_preferences for insert
  with check (auth.uid() = user_id);

drop policy if exists "user_preferences_update_own" on public.user_preferences;
create policy "user_preferences_update_own"
  on public.user_preferences for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
