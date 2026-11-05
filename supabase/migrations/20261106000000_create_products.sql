create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 80),
  account_type text not null default 'buyer'
    check (account_type in ('buyer', 'seller')),
  location text not null default 'Metro Manila'
    check (char_length(location) between 1 and 100),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name, location) on public.profiles to authenticated;

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_type text;
  requested_name text;
begin
  requested_type := case
    when new.raw_user_meta_data ->> 'account_type' = 'seller' then 'seller'
    else 'buyer'
  end;
  requested_name := left(
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Partsy member'
    ),
    80
  );

  insert into public.profiles (id, display_name, account_type)
  values (new.id, requested_name, requested_type)
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.create_profile_for_new_user()
  from public, anon, authenticated;

drop trigger if exists create_profile_after_signup on auth.users;
create trigger create_profile_after_signup
  after insert on auth.users
  for each row execute function public.create_profile_for_new_user();

insert into public.profiles (id, display_name, account_type)
select
  users.id,
  left(
    coalesce(
      nullif(btrim(users.raw_user_meta_data ->> 'display_name'), ''),
      nullif(split_part(coalesce(users.email, ''), '@', 1), ''),
      'Partsy member'
    ),
    80
  ),
  case
    when users.raw_user_meta_data ->> 'account_type' = 'seller' then 'seller'
    else 'buyer'
  end
from auth.users as users
on conflict (id) do nothing;

create or replace function public.become_seller()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to become a seller';
  end if;

  update public.profiles
  set account_type = 'seller'
  where id = auth.uid();

  if not found then
    raise exception 'Your account profile was not found';
  end if;
end;
$$;

revoke all on function public.become_seller() from public, anon;
grant execute on function public.become_seller() to authenticated;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 2 and 100),
  category text not null check (
    category in (
      'Graphics Cards',
      'Processors',
      'Memory',
      'Storage',
      'Motherboards',
      'Cases & Cooling',
      'Power Supplies'
    )
  ),
  price numeric(12, 2) not null check (price > 0),
  condition text not null check (condition in ('New', 'Like new', 'Good')),
  seller_name text not null check (char_length(seller_name) between 1 and 80),
  location text not null default 'Metro Manila',
  image_url text not null check (char_length(image_url) between 1 and 2048),
  created_at timestamptz not null default now()
);

create index if not exists products_category_created_at_idx
  on public.products (category, created_at desc);

create or replace function public.set_product_seller_details()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() is null or new.seller_id <> auth.uid() then
    raise exception 'A listing must belong to the signed-in seller';
  end if;

  select profiles.display_name, profiles.location
  into new.seller_name, new.location
  from public.profiles
  where profiles.id = new.seller_id
    and profiles.account_type = 'seller';

  if not found then
    raise exception 'Only seller accounts can create or update listings';
  end if;

  return new;
end;
$$;

drop trigger if exists set_product_seller_details on public.products;
create trigger set_product_seller_details
  before insert or update on public.products
  for each row execute function public.set_product_seller_details();

alter table public.products enable row level security;

drop policy if exists "Anyone can view listings" on public.products;
create policy "Anyone can view listings"
  on public.products for select
  using (true);

drop policy if exists "Sellers can create their own listings" on public.products;
create policy "Sellers can create their own listings"
  on public.products for insert
  to authenticated
  with check (
    auth.uid() = seller_id
    and exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.account_type = 'seller'
    )
  );

drop policy if exists "Sellers can update their own listings" on public.products;
create policy "Sellers can update their own listings"
  on public.products for update
  to authenticated
  using (
    auth.uid() = seller_id
    and exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.account_type = 'seller'
    )
  )
  with check (
    auth.uid() = seller_id
    and exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.account_type = 'seller'
    )
  );

drop policy if exists "Sellers can delete their own listings" on public.products;
create policy "Sellers can delete their own listings"
  on public.products for delete
  to authenticated
  using (
    auth.uid() = seller_id
    and exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.account_type = 'seller'
    )
  );

grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
