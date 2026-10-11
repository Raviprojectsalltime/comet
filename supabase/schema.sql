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
   '{casual,college,sport,travel,colorful,men,boyfriend,date}', '/images/madagascar.jpg', '/images/madagascar-hover.jpg', '{3,4,5,6,7,8,9,10,11,12}', 6),
  ('chestnut', 'Chestnut', 'CHESTNUT', 'X Lows', 4299, 'TRENDING', 'Brown White',
   '{casual,college,daily,everyday,men,boyfriend,neutral}', '/images/chestnut.jpg', null, '{3,4,5,6,7,8,9,10,11,12}', 7),
  ('snow', 'Snow', 'SNOW', 'X Lows', 4299, null, 'Blue White',
   '{casual,college,sport,daily,men,clean,white}', '/images/snow.jpg', null, '{3,4,5,6,7,8,9,10,11,12}', 8),
  ('armstrong', 'Armstrong', 'ARMSTRONG', 'X Lows', 4299, 'EXCLUSIVE PRICE', 'Black',
   '{daily,everyday,sport,men,boyfriend,black,office}', '/images/armstrong.jpg', null, '{3,4,5,6,7,8,9,10,11,12}', 9),
  ('greyscale', 'Greyscale', 'GREYSCALE', 'X Lows', 4299, null, 'Grey White',
   '{casual,college,daily,men,neutral,grey}', '/images/greyscale.jpg', null, '{3,4,5,6,7,8,9,10,11,12}', 10),
  ('hazelnut', 'Hazelnut', 'HAZELNUT', 'X Lows', 4299, null, 'Tan Orange',
   '{casual,date,college,daily,men,boyfriend,warm}', '/images/hazelnut.jpg', null, '{3,4,5,6,7,8,9,10,11,12}', 11),
  ('dawn', 'Dawn', 'DAWN', 'X Lows', 5299, null, 'Yellow Blue',
   '{sport,casual,colorful,college,travel,statement}', '/images/dawn.jpg', null, '{3,4,5,6,7,8,9,10,11,12}', 12),
  ('pumpkin', 'Pumpkin', 'PUMPKIN', 'X Lows', 4299, null, 'Orange Black',
   '{party,colorful,casual,college,statement,orange}', '/images/pumpkin.jpg', null, '{3,4,5,6,7,8,9,10,11,12}', 13),
  ('riptide', 'Riptide', 'RIPTIDE', 'Aeon V2', 4499, 'NEW LAUNCH', 'Blue White',
   '{sport,gym,running,men,boyfriend,daily}', '/images/riptide.jpg', null, '{4,5,6,7,8,9,10,11,12}', 14),
  ('affogato', 'Affogato', 'AFFOGATO', 'Aeon V2', 4499, 'EXCLUSIVE PRICE', 'Brown Beige',
   '{casual,daily,everyday,college,men,neutral}', '/images/affogato.jpg', null, '{4,5,6,7,8,9,10,11,12}', 15),
  ('mango-chilli', 'Mango Chilli', 'MANGO CHILLI', 'Aeon V2', 4899, 'TRENDING', 'Orange Multi',
   '{party,colorful,statement,festive,date,trendy,orange}', '/images/mango-chilli.jpg', null, '{4,5,6,7,8,9,10,11,12}', 16),
  ('carbon', 'Carbon', 'CARBON', 'Aeon V2', 4499, null, 'Black',
   '{sport,gym,daily,men,boyfriend,black,running}', '/images/carbon.jpg', null, '{4,5,6,7,8,9,10,11,12}', 17),
  ('stereo', 'Stereo', 'STEREO', 'Aeon V2', 5299, 'EXCLUSIVE PRICE', 'Blue White',
   '{sport,gym,casual,men,college,running}', '/images/stereo.jpg', null, '{4,5,6,7,8,9,10,11,12}', 18),
  ('mintchip', 'Mintchip', 'MINTCHIP', 'Aeon V2', 4499, null, 'Green Beige',
   '{college,casual,daily,men,fresh,green}', '/images/mintchip.jpg', null, '{4,5,6,7,8,9,10,11,12}', 19),
  ('jellybean', 'Jellybean', 'JELLYBEAN', 'Aeon V2', 4899, 'NEW LAUNCH', 'Multicolour',
   '{party,colorful,gift,girl,women,trendy,festive,statement}', '/images/jellybean.jpg', null, '{4,5,6,7,8,9,10,11,12}', 20),
  ('mustang', 'Mustang', 'MUSTANG', 'Aeon V2', 4499, null, 'Brown Cream',
   '{casual,daily,everyday,men,boyfriend,travel,brown}', '/images/mustang.jpg', null, '{4,5,6,7,8,9,10,11,12}', 21),
  ('haze', 'Haze', 'HAZE', 'Aeres', 5299, null, 'Blue White',
   '{sport,casual,men,college,daily,blue}', '/images/haze.jpg', null, '{4,5,6,7,8,9,10,11,12}', 22),
  ('oakwood', 'Oakwood', 'OAKWOOD', 'Aeres', 5299, null, 'Brown White',
   '{casual,date,daily,men,boyfriend,brown,smart}', '/images/oakwood.jpg', null, '{4,5,6,7,8,9,10,11,12}', 23)
on conflict (id) do nothing;

-- The server uses the secret key, which bypasses Row Level Security,
-- so no policies are needed for the server-side reads/writes above.
