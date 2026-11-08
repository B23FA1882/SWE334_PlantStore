-- GREENROOM / SWE334 | initial schema and RLS
-- Run once on an active Supabase project (SQL Editor or Supabase CLI migration).
create extension if not exists pgcrypto;
create schema if not exists app_private;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'customer' check (role in ('customer','admin')),
  created_at timestamptz not null default now()
);
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  name text not null check (char_length(name) between 2 and 150),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  subtitle text not null default '',
  description text not null default '',
  price numeric(12,2) not null check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  form text not null default 'monstera',
  pot_color text not null default '#b99070',
  light text not null default 'Шууд бус гэрэл',
  water text not null default '7 хоногт 1 удаа',
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_products_category on public.products(category_id);
create index if not exists idx_products_active on public.products(active);
create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique
);
create table if not exists public.product_tags (
  product_id uuid not null references public.products(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (product_id,tag_id)
);
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  status text not null default 'pending' check (status in ('pending','paid','cancelled')),
  total_amount numeric(12,2) not null default 0 check (total_amount >= 0),
  phone text not null check (char_length(phone) between 4 and 20),
  address text not null check (char_length(address) between 5 and 400),
  payment_ref text,
  created_at timestamptz not null default now()
);
create index if not exists idx_orders_user on public.orders(user_id,created_at desc);
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null check (quantity between 1 and 20),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  unique(order_id,product_id)
);
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  provider text not null check (provider in ('stripe','qpay','byl')),
  external_id text not null unique,
  amount numeric(12,2) not null check (amount >= 0),
  status text not null default 'pending' check (status in ('pending','paid','failed')),
  created_at timestamptz not null default now()
);

-- Roles are kept in database-controlled profiles, NOT mutable user_metadata.
create or replace function public.create_profile_on_signup()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id,full_name,role)
  values (new.id,left(coalesce(new.raw_user_meta_data->>'full_name',''),100),'customer')
  on conflict(id) do nothing;
  return new;
end
$$;
revoke all on function public.create_profile_on_signup() from public,anon,authenticated;
drop trigger if exists on_auth_user_created_greenroom on auth.users;
create trigger on_auth_user_created_greenroom
  after insert on auth.users for each row execute function public.create_profile_on_signup();

create or replace function app_private.is_admin()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (
  select 1 from public.profiles where id = (select auth.uid()) and role = 'admin'
) $$;
revoke all on function app_private.is_admin() from public;
grant usage on schema app_private to authenticated;
grant execute on function app_private.is_admin() to authenticated;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.tags enable row level security;
alter table public.product_tags enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;

create policy "profile_self_or_admin_read" on public.profiles for select to authenticated
using (id = (select auth.uid()) or app_private.is_admin());

create policy "categories_public_read" on public.categories for select to anon,authenticated using (true);
create policy "categories_admin_write" on public.categories for all to authenticated
using (app_private.is_admin()) with check (app_private.is_admin());

create policy "products_public_read" on public.products for select to anon,authenticated using (active = true);
create policy "products_admin_all" on public.products for all to authenticated
using (app_private.is_admin()) with check (app_private.is_admin());

create policy "tags_public_read" on public.tags for select to anon,authenticated using (true);
create policy "tags_admin_all" on public.tags for all to authenticated
using (app_private.is_admin()) with check (app_private.is_admin());

create policy "product_tags_public_read" on public.product_tags for select to anon,authenticated using (true);
create policy "product_tags_admin_all" on public.product_tags for all to authenticated
using (app_private.is_admin()) with check (app_private.is_admin());

create policy "orders_owner_select" on public.orders for select to authenticated
using (user_id = (select auth.uid()));
create policy "orders_admin_select" on public.orders for select to authenticated
using (app_private.is_admin());
-- Customers cannot INSERT/UPDATE orders directly: only place_order RPC may create an order.
create policy "orders_admin_update" on public.orders for update to authenticated
using (app_private.is_admin()) with check (app_private.is_admin());

create policy "items_owner_select" on public.order_items for select to authenticated
using (exists (select 1 from public.orders o where o.id=order_id and o.user_id=(select auth.uid())));
create policy "items_admin_select" on public.order_items for select to authenticated
using (app_private.is_admin());

create policy "payments_owner_select" on public.payments for select to authenticated
using (exists (select 1 from public.orders o where o.id=order_id and o.user_id=(select auth.uid())));
create policy "payments_admin_select" on public.payments for select to authenticated
using (app_private.is_admin());
-- All payment mutations MUST originate from authenticated server-side webhook with service role.

-- Intentionally limit grants; RLS is a separate protection layer.
grant usage on schema public to anon,authenticated;
grant select on public.categories,public.products,public.tags,public.product_tags to anon,authenticated;
grant select on public.profiles,public.orders,public.order_items,public.payments to authenticated;
grant insert,update,delete on public.products,public.categories,public.tags,public.product_tags to authenticated;
grant update on public.orders to authenticated;
revoke insert,update,delete on public.profiles,public.order_items,public.payments from anon,authenticated;
revoke insert,delete on public.orders from anon,authenticated;

-- Create orders on the server: prices are read from products (never trusted from the browser).
create or replace function public.place_order(p_items jsonb,p_phone text,p_address text)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare
  v_order uuid;
  v_item jsonb;
  v_product public.products%rowtype;
  v_product_id uuid;
  v_qty integer;
  v_total numeric(12,2) := 0;
begin
  if (select auth.uid()) is null then raise exception 'Login required'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 40 then
    raise exception 'Cart must contain 1 to 40 items';
  end if;
  if char_length(trim(coalesce(p_phone,''))) not between 4 and 20
    or char_length(trim(coalesce(p_address,''))) not between 5 and 400 then
    raise exception 'Invalid phone or address';
  end if;
  insert into public.orders(user_id,phone,address) values ((select auth.uid()),trim(p_phone),trim(p_address)) returning id into v_order;
  for v_item in select value from jsonb_array_elements(p_items) order by value->>'product_id' loop
    v_product_id := (v_item->>'product_id')::uuid;
    v_qty := (v_item->>'quantity')::integer;
    if v_qty is null or v_qty not between 1 and 20 then raise exception 'Invalid quantity'; end if;
    select * into v_product from public.products where id=v_product_id and active=true for update;
    if not found then raise exception 'Product unavailable'; end if;
    if v_product.stock < v_qty then raise exception 'Insufficient stock for %',v_product.name; end if;
    insert into public.order_items(order_id,product_id,quantity,unit_price)
      values(v_order,v_product_id,v_qty,v_product.price);
    update public.products set stock=stock-v_qty where id=v_product_id;
    v_total := v_total+v_product.price*v_qty;
  end loop;
  update public.orders set total_amount=v_total where id=v_order;
  return v_order;
end
$$;
revoke all on function public.place_order(jsonb,text,text) from public,anon;
grant execute on function public.place_order(jsonb,text,text) to authenticated;

-- Supabase Storage: public display, admin-only writes, 4MB image limit.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values('plant-images','plant-images',true,4194304,array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
create policy "greenroom_images_read" on storage.objects for select to public
using (bucket_id='plant-images');
create policy "greenroom_images_admin_insert" on storage.objects for insert to authenticated
with check (bucket_id='plant-images' and app_private.is_admin());
create policy "greenroom_images_admin_update" on storage.objects for update to authenticated
using (bucket_id='plant-images' and app_private.is_admin())
with check (bucket_id='plant-images' and app_private.is_admin());
create policy "greenroom_images_admin_delete" on storage.objects for delete to authenticated
using (bucket_id='plant-images' and app_private.is_admin());

-- Default catalog. Sample prices are placeholders for the coursework demo.
insert into public.categories(name,slug) values
('Монстера','monstera'),('Сансевиерия','snake'),('Фикус','ficus'),('Кактус','cactus'),
('Потос','pothos'),('Цэцэг','flower'),('Замиокулькас','stem'),('Суккулент','succulent'),
('Палм','palm'),('Ойм','fern')
on conflict (slug) do nothing;

insert into public.products (slug,name,subtitle,description,price,stock,form,light,water,category_id,pot_color)
select s.slug,s.name,s.subtitle,s.description,s.price,20,s.form,s.light,s.water,c.id,s.pot_color
from (values
('monstera','Монстера Делициоза','Том навчтай ургамал','Өрөөний уур амьсгалыг нэг дор шинэчилнэ.',89000,'monstera','Тод, шууд бус гэрэл','7 хоногт 1 удаа','monstera','#b57d5c'),
('snake-plant','Сансевиерия','Арчилгаа багатай','Завгүй өдрүүдийн хамгийн сайн ногоон хамтрагч.',52000,'snake','Сүүдэр даана','10–14 хоногт','snake','#d3b8a3'),
('fiddle-fig','Фикус Лирата','Интерьерийн ургамал','Оффисын буланд уран баримал шиг харагдана.',125000,'ficus','Тод гэрэл','7 хоногт 1 удаа','ficus','#9f9a83'),
('cactus','Мини кактус','Ширээний ургамал','Ажлын ширээнд тань жижигхэн цөлийн мэдрэмж.',28000,'cactus','Нартай цонх','2–3 долоо хоногт','cactus','#c98967'),
('pothos','Алтан потос','Унждаг ургамал','Тавиур, номын санг зөөлөн чимэх мөчир.',45000,'pothos','Дунд зэргийн гэрэл','7 хоногт 1 удаа','pothos','#a79d8d'),
('peace-lily','Спатифиллум','Цэцэглэдэг ургамал','Даруухан цагаан цэцэг, тайван уур амьсгал.',67000,'flower','Шууд бус гэрэл','5–7 хоногт','flower','#c4aa92'),
('zz-plant','Замиокулькас','Оффист тохиромжтой','Гялалзсан навчтай, тэсвэртэй ургамал.',76000,'stem','Сүүдэр даана','10–14 хоногт','stem','#b57d5c'),
('succulent','Эхеверия','Мини суккулент','Хамгийн бага зайд хамгийн их хөөрхөн төрх.',32000,'succulent','Тод гэрэл','14 хоногт','succulent','#d3b8a3'),
('parlor-palm','Хамедорея Палм','Агаарлаг ногоон','Ажиллах орчинд халуун орны мэдрэмж нэмнэ.',94000,'palm','Шууд бус гэрэл','5–7 хоногт','palm','#9f9a83'),
('rubber-plant','Резинэн фикус','Өрөөний ургамал','Гүн ногоон навчтай минималист төрх.',82000,'ficus','Тод гэрэл','7 хоногт 1 удаа','ficus','#c98967'),
('fern','Бостон ойм','Чийгэнд дуртай','Зөөлөн бүтэцтэй сэрүүн ногоон өнгө.',49000,'fern','Шууд бус гэрэл','3–5 хоногт','fern','#a79d8d'),
('orchid','Фаленопсис Орхидей','Цэцэглэдэг ургамал','Тансаг цагаан цэцгээр ажлын орчноо чимээрэй.',109000,'flower','Тод, шууд бус гэрэл','7–10 хоногт','flower','#c4aa92')
) as s(slug,name,subtitle,description,price,form,light,water,category_slug,pot_color)
join public.categories c on c.slug=s.category_slug
on conflict(slug) do nothing;

insert into public.tags(name,slug) values ('Арчилгаа хялбар','easy-care'),('Оффис','office'),('Ширээний','desk'),('Цэцэглэдэг','flowering') on conflict(slug) do nothing;
insert into public.product_tags(product_id,tag_id)
select p.id,t.id from public.products p cross join public.tags t
where (p.slug in ('snake-plant','cactus','zz-plant','succulent') and t.slug='easy-care')
   or (p.slug in ('monstera','fiddle-fig','pothos','parlor-palm') and t.slug='office')
   or (p.slug in ('cactus','succulent') and t.slug='desk')
   or (p.slug in ('peace-lily','orchid') and t.slug='flowering')
on conflict do nothing;

-- To grant your own account admin rights AFTER signup, run manually in SQL Editor:
-- update public.profiles set role='admin'
-- where id=(select id from auth.users where email='YOUR_OWN_EMAIL@example.com');
