create table if not exists public.favorites (
  buyer_id uuid not null references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (buyer_id, product_id)
);

create table if not exists public.cart_items (
  buyer_id uuid not null references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  quantity integer not null default 1 check (quantity between 1 and 20),
  updated_at timestamptz not null default now(),
  primary key (buyer_id, product_id)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references auth.users (id) on delete restrict,
  status text not null default 'pending'
    check (status in ('pending', 'cancelled')),
  total numeric(12, 2) not null check (total >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  product_name text not null,
  seller_id uuid references auth.users (id) on delete set null,
  quantity integer not null check (quantity between 1 and 20),
  unit_price numeric(12, 2) not null check (unit_price > 0)
);

create index if not exists orders_buyer_created_at_idx
  on public.orders (buyer_id, created_at desc);
create index if not exists order_items_order_id_idx
  on public.order_items (order_id);

alter table public.favorites enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "Users manage their own favorites" on public.favorites;
create policy "Users manage their own favorites"
  on public.favorites for all
  to authenticated
  using (auth.uid() = buyer_id)
  with check (auth.uid() = buyer_id);

drop policy if exists "Users manage their own cart" on public.cart_items;
create policy "Users manage their own cart"
  on public.cart_items for all
  to authenticated
  using (auth.uid() = buyer_id)
  with check (auth.uid() = buyer_id);

drop policy if exists "Users view their own orders" on public.orders;
create policy "Users view their own orders"
  on public.orders for select
  to authenticated
  using (auth.uid() = buyer_id);

drop policy if exists "Users view their own order items" on public.order_items;
create policy "Users view their own order items"
  on public.order_items for select
  to authenticated
  using (
    exists (
      select 1
      from public.orders
      where orders.id = order_items.order_id
        and orders.buyer_id = auth.uid()
    )
  );

grant select, insert, update, delete on public.favorites to authenticated;
grant select, insert, update, delete on public.cart_items to authenticated;
grant select on public.orders, public.order_items to authenticated;
revoke insert, update, delete on public.orders, public.order_items from anon, authenticated;

create or replace function public.change_cart_item(
  p_product_id uuid,
  p_quantity_delta integer
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_quantity integer;
  next_quantity integer;
begin
  if auth.uid() is null then
    raise exception 'Sign in to update your cart';
  end if;
  if p_quantity_delta is null or p_quantity_delta not in (-1, 1) then
    raise exception 'Cart quantity can only change by one';
  end if;

  perform 1
  from public.products
  where id = p_product_id;
  if not found then
    raise exception 'This listing is no longer available';
  end if;

  if p_quantity_delta = 1 then
    insert into public.cart_items as existing_cart (buyer_id, product_id, quantity)
    values (auth.uid(), p_product_id, 1)
    on conflict (buyer_id, product_id) do update
      set quantity = existing_cart.quantity + 1,
          updated_at = now()
      where existing_cart.quantity < 20
    returning quantity into next_quantity;

    if not found then
      raise exception 'The maximum quantity per part is 20';
    end if;
    return next_quantity;
  end if;

  select quantity
  into current_quantity
  from public.cart_items
  where buyer_id = auth.uid()
    and product_id = p_product_id
  for update;

  if not found then
    return 0;
  elsif current_quantity = 1 then
    delete from public.cart_items
    where buyer_id = auth.uid()
      and product_id = p_product_id;
    return 0;
  end if;

  update public.cart_items
  set quantity = quantity - 1, updated_at = now()
  where buyer_id = auth.uid()
    and product_id = p_product_id
  returning quantity into next_quantity;
  return next_quantity;
end;
$$;

revoke all on function public.change_cart_item(uuid, integer) from public, anon;
grant execute on function public.change_cart_item(uuid, integer) to authenticated;

create or replace function public.place_order_request()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_buyer uuid := auth.uid();
  order_id uuid;
  item record;
  order_total numeric(12, 2) := 0;
begin
  if current_buyer is null then
    raise exception 'Sign in to submit an order request';
  end if;

  perform 1
  from public.cart_items
  where buyer_id = current_buyer
  for update;

  if not found then
    raise exception 'Your cart is empty';
  end if;

  insert into public.orders (buyer_id, status, total)
  values (current_buyer, 'pending', 0)
  returning id into order_id;

  for item in
    select
      cart.product_id,
      cart.quantity,
      product.name,
      product.seller_id,
      product.price
    from public.cart_items as cart
    join public.products as product on product.id = cart.product_id
    where cart.buyer_id = current_buyer
    for update of cart, product
  loop
    if item.seller_id = current_buyer then
      raise exception 'You cannot submit an order request for your own listing';
    end if;

    order_total := order_total + item.price * item.quantity;
    insert into public.order_items (
      order_id, product_id, product_name, seller_id, quantity, unit_price
    )
    values (
      order_id, item.product_id, item.name, item.seller_id, item.quantity, item.price
    );
  end loop;

  if order_total <= 0 then
    raise exception 'Your cart has no available listings';
  end if;

  update public.orders
  set total = order_total
  where id = order_id;

  delete from public.cart_items
  where buyer_id = current_buyer;

  return order_id;
end;
$$;

revoke all on function public.place_order_request() from public, anon;
grant execute on function public.place_order_request() to authenticated;
