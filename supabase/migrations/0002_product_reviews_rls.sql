alter table public.product_reviews enable row level security;

drop policy if exists product_reviews_select_own_or_seller on public.product_reviews;
create policy product_reviews_select_own_or_seller on public.product_reviews
for select to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.products p
    where p.id::text = product_reviews.product_id::text
      and p.seller_id = auth.uid()
  )
);

drop policy if exists product_reviews_insert_own on public.product_reviews;
create policy product_reviews_insert_own on public.product_reviews
for insert to authenticated
with check (
  user_id = auth.uid()
  and public.current_user_role() = 'buyer'
);

grant select, insert on public.product_reviews to authenticated;
revoke all on public.product_reviews from anon;
