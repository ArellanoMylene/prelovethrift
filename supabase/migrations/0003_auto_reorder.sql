create or replace function public.apply_order_item_stock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.product_id is not null then
    update public.products
       set stock = greatest(stock - new.quantity, 0),
           sold = sold + new.quantity
     where id = new.product_id;
  end if;

  return new;
end;
$$;

drop trigger if exists after_order_items_stock on public.order_items;
create trigger after_order_items_stock
after insert on public.order_items
for each row execute function public.apply_order_item_stock();

revoke all on function public.apply_order_item_stock() from public;

create or replace function public.apply_product_auto_reorder()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.auto_reorder
     and new.stock <= new.reorder_point
     and new.stock <> new.reorder_point + 10 then
    update public.products
       set stock = new.reorder_point + 10
     where id = new.id
       and stock = new.stock;
  end if;

  return new;
end;
$$;

drop trigger if exists after_product_auto_reorder_enabled on public.products;
create trigger after_product_auto_reorder_enabled
after update of stock, auto_reorder, reorder_point on public.products
for each row
when (new.auto_reorder and new.stock <= new.reorder_point)
execute function public.apply_product_auto_reorder();

revoke all on function public.apply_product_auto_reorder() from public;
