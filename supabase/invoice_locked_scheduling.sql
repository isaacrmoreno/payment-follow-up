alter table public.invoices
  add column if not exists reminder_cadence jsonb;

alter table public.invoices
  add column if not exists reminder_send_time text;

grant update(reminder_cadence) on public.invoices to authenticated;
grant update(reminder_send_time) on public.invoices to authenticated;
