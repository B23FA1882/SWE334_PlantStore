-- GREENROOM: QPay invoices are cached for idempotent QR display after refresh.
-- Service-role Edge Functions own all writes. Customers can only read their invoice.
create table if not exists public.qpay_invoices (
  order_id uuid primary key references public.orders(id) on delete restrict,
  invoice_id text not null unique,
  qr_image text,
  qr_text text,
  urls jsonb not null default '[]'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'paid', 'cancelled')),
  created_at timestamptz not null default now()
);

alter table public.qpay_invoices enable row level security;

revoke all on public.qpay_invoices from public, anon, authenticated;
grant select on public.qpay_invoices to authenticated;

drop policy if exists "qpay_invoice_owner_select" on public.qpay_invoices;
create policy "qpay_invoice_owner_select" on public.qpay_invoices
for select to authenticated using (
  exists (
    select 1 from public.orders o
    where o.id = order_id and o.user_id = (select auth.uid())
  )
);

drop policy if exists "qpay_invoice_admin_select" on public.qpay_invoices;
create policy "qpay_invoice_admin_select" on public.qpay_invoices
for select to authenticated using (app_private.is_admin());
