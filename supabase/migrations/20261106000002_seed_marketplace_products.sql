alter table public.products
  alter column seller_id drop not null;

create or replace function public.set_product_seller_details()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  authenticated_seller uuid := auth.uid();
begin
  if authenticated_seller is null then
    if current_user = 'postgres' and new.seller_id is null then
      return new;
    end if;

    raise exception 'A listing must belong to the signed-in seller';
  end if;

  if new.seller_id is distinct from authenticated_seller then
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

insert into public.products (
  seller_id, name, category, price, condition, seller_name, location, image_url
)
select
  null,
  seed.name,
  seed.category,
  seed.price,
  seed.condition,
  'Partsy Select',
  'Metro Manila',
  seed.image_url
from (
  values
    ('GeForce RTX 4070 SUPER', 'Graphics Cards', 28900, 'Like new', 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=900&q=85'),
    ('Radeon RX 7800 XT 16GB', 'Graphics Cards', 25900, 'Like new', 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=900&q=85'),
    ('GeForce RTX 4060 Ti 8GB', 'Graphics Cards', 18900, 'Good', 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=900&q=85'),
    ('GeForce RTX 3060 12GB', 'Graphics Cards', 13800, 'Good', 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=900&q=85'),
    ('Ryzen 7 7800X3D', 'Processors', 18950, 'Like new', 'https://images.unsplash.com/photo-1555617981-dac3880eac6e?auto=format&fit=crop&w=900&q=85'),
    ('Ryzen 5 7600X', 'Processors', 10200, 'New', 'https://images.unsplash.com/photo-1555617981-dac3880eac6e?auto=format&fit=crop&w=900&q=85'),
    ('Intel Core i7-14700K', 'Processors', 21900, 'Like new', 'https://images.unsplash.com/photo-1555617981-dac3880eac6e?auto=format&fit=crop&w=900&q=85'),
    ('Intel Core i5-13400F', 'Processors', 8950, 'Good', 'https://images.unsplash.com/photo-1555617981-dac3880eac6e?auto=format&fit=crop&w=900&q=85'),
    ('ROG Strix B650E-F Gaming', 'Motherboards', 12400, 'Good', 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=85'),
    ('MSI MAG B760 Tomahawk WiFi', 'Motherboards', 10900, 'Like new', 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=85'),
    ('Gigabyte B550 AORUS Elite AX', 'Motherboards', 7250, 'Good', 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=85'),
    ('ASUS TUF Gaming B650-Plus', 'Motherboards', 9850, 'New', 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=85'),
    ('Corsair Vengeance DDR5 32GB', 'Memory', 5350, 'New', 'https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=900&q=85'),
    ('G.Skill Trident Z5 Neo 32GB', 'Memory', 6100, 'Like new', 'https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=900&q=85'),
    ('Kingston Fury Beast DDR4 32GB', 'Memory', 2950, 'Good', 'https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=900&q=85'),
    ('TeamGroup T-Force Delta DDR5 32GB', 'Memory', 4850, 'Like new', 'https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=900&q=85'),
    ('Samsung 990 PRO NVMe 2TB', 'Storage', 7890, 'Like new', 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=900&q=85'),
    ('WD Black SN850X NVMe 1TB', 'Storage', 4590, 'New', 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=900&q=85'),
    ('Crucial P3 Plus NVMe 2TB', 'Storage', 4290, 'Good', 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=900&q=85'),
    ('Kingston NV2 NVMe 1TB', 'Storage', 2650, 'Like new', 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=900&q=85'),
    ('NZXT H5 Flow Mid Tower', 'Cases & Cooling', 4200, 'Good', 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=900&q=85'),
    ('Lian Li Lancool 216', 'Cases & Cooling', 5350, 'Like new', 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=900&q=85'),
    ('DeepCool AK620 Zero Dark', 'Cases & Cooling', 3150, 'Like new', 'https://images.unsplash.com/photo-1587202372616-b43abea06c2a?auto=format&fit=crop&w=900&q=85'),
    ('Arctic Liquid Freezer III 240', 'Cases & Cooling', 4250, 'New', 'https://images.unsplash.com/photo-1587202372616-b43abea06c2a?auto=format&fit=crop&w=900&q=85'),
    ('MSI MAG A750GL 750W Gold', 'Power Supplies', 4950, 'New', 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&w=900&q=85'),
    ('Corsair RM850e 850W Gold', 'Power Supplies', 6950, 'Like new', 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&w=900&q=85'),
    ('Cooler Master MWE 650 Bronze V2', 'Power Supplies', 2550, 'Good', 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&w=900&q=85'),
    ('Seasonic Focus GX-750 Gold', 'Power Supplies', 5100, 'Like new', 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&w=900&q=85')
) as seed(name, category, price, condition, image_url)
where not exists (
  select 1
  from public.products as existing
  where existing.seller_id is null
    and existing.name = seed.name
);
