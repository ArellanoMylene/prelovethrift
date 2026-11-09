alter table public.reorder_requests enable row level security;

drop policy if exists reorder_requests_select_seller_products on public.reorder_requests;
create policy reorder_requests_select_seller_products on public.reorder_requests
for select to authenticated
using (
  exists (
    select 1
    from public.products p
    where p.id = reorder_requests.product_id
      and p.seller_id = auth.uid()
  )
);

drop policy if exists reorder_requests_insert_seller_products on public.reorder_requests;
create policy reorder_requests_insert_seller_products on public.reorder_requests
for insert to authenticated
with check (
  exists (
    select 1
    from public.products p
    where p.id = reorder_requests.product_id
      and p.seller_id = auth.uid()
  )
);

grant select, insert on public.reorder_requests to authenticated;
revoke all on public.reorder_requests from anon;
