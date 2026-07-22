create table if not exists public.reminder_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  subject text not null,
  body text not null,
  is_default boolean not null default false,
  kind text not null default 'custom',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.reminder_templates
  add column if not exists is_default boolean not null default false;

alter table public.reminder_templates
  add column if not exists kind text not null default 'custom';

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.reminder_templates to authenticated;

alter table public.reminder_templates enable row level security;

drop policy if exists "reminder_templates_select_own" on public.reminder_templates;
create policy "reminder_templates_select_own"
  on public.reminder_templates for select
  using (auth.uid() = user_id);

drop policy if exists "reminder_templates_insert_own" on public.reminder_templates;
create policy "reminder_templates_insert_own"
  on public.reminder_templates for insert
  with check (auth.uid() = user_id);

drop policy if exists "reminder_templates_update_own" on public.reminder_templates;
create policy "reminder_templates_update_own"
  on public.reminder_templates for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "reminder_templates_delete_own" on public.reminder_templates;
create policy "reminder_templates_delete_own"
  on public.reminder_templates for delete
  using (auth.uid() = user_id);

alter table public.invoices
  add column if not exists reminder_template_id uuid references public.reminder_templates(id) on delete set null;

alter table public.invoices
  add column if not exists reminder_plan text not null default 'soft_firm_final';

grant update(reminder_template_id) on public.invoices to authenticated;
grant update(reminder_plan) on public.invoices to authenticated;
