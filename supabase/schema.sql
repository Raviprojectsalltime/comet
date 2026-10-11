-- Comet website schema
-- Run this once in Supabase Dashboard → SQL Editor → New query → Run.

-- Products served by GET /api/products
create table if not exists products (
  id text primary key,
  name text not null,
  title text not null,
  silhouette text not null,
  price integer not null,
  badge text,
  color text,
  tags text[] default '{}',
  image text,
  hover_image text,
  sizes integer[] default '{}',
  sort_order integer default 0
);

-- Newsletter signups from the footer (POST /api/newsletter)
create table if not exists newsletter_subscribers (
  id bigint generated always as identity primary key,
  email text not null unique,
  created_at timestamptz default now()
);

-- Help-chat conversation log (POST /api/chat)
create table if not exists chat_messages (
  id bigint generated always as identity primary key,
  message text,
  reply text,
  created_at timestamptz default now()
);

-- Seed product data (same as server/products.json fallback)
insert into products (id, name, title, silhouette, price, badge, color, tags, image, hover_image, sizes, sort_order)
values
  ('cortado', 'Cortado', 'CORTADO', 'X Lows', 4299, 'EXCLUSIVE PRICE', 'Cream Canvas',
   '{casual,college,daily,everyday,men,boyfriend,date,neutral}', '/images/cortado.jpg', '/images/cortado-hover.jpg', '{3,4,5,6,7,8,9,10,11,12}', 1),
  ('hukum-midnight', 'Hukum Midnight', 'HUKUM MIDNIGHT', 'Aeres', 5899, 'PRE-ORDER NOW', 'Aeres Black Gold',
   '{party,designer,design,trendy,special,gift,date,statement,night}', '/images/hukum-midnight.jpg', '/images/hukum-midnight-hover.jpg', '{4,5,6,7,8,9,10,11,12}', 2),
  ('hukum-ivory', 'Hukum Ivory', 'HUKUM IVORY', 'Aeres', 5899, 'PRE-ORDER NOW', 'Aeres Cream Gold',
   '{party,designer,design,trendy,special,gift,date,wedding,statement}', '/images/hukum-ivory.jpg', '/images/hukum-ivory-hover.jpg', '{4,5,6,7,8,9,10,11,12}', 3),
  ('wild-bloom', 'Wild Bloom', 'WILD BLOOM', 'Astra', 4899, 'PRE-ORDER NOW', 'Astra Purple White',
   '{women,girl,gift,party,date,trendy,casual,college}', '/images/wild-bloom.jpg', '/images/wild-bloom-hover.jpg', '{3,4,5,6,7}', 4),
  ('cobalt', 'Cobalt', 'COBALT', 'Aeres', 5299, 'EXCLUSIVE PRICE', 'Aeres Navy White',
   '{sport,gym,college,casual,daily,men,boyfriend}', '/images/cobalt.jpg', '/images/cobalt-hover.jpg', '{3,4,5,6,7,8,9,10,11,12}', 5),
  ('madagascar', 'Madagascar', 'MADAGASCAR', 'X Lows', 4299, null, 'Multi Blue',
   '{casual,college,sport,travel,colorful,men,boyfriend,date}', '/images/madagascar.jpg', '/images/madagascar-hover.jpg', '{3,4,5,6,7,8,9,10,11,12}', 6)
on conflict (id) do nothing;

-- The server uses the secret key, which bypasses Row Level Security,
-- so no policies are needed for the server-side reads/writes above.
