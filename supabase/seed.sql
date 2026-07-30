-- Seed FC 26 coin packs (GBP), based on LootBar USD list converted ~0.79
-- Easy to change later from admin panel

insert into public.products
  (slug, name, description, coin_amount, bonus_coins, price_gbp_pence, compare_at_gbp_pence, platform, sort_order)
values
  ('fc26-100k-ps', '100K Safe Coins', 'EA FC 26 Ultimate Team coins for PlayStation.', 100000, 8000, 70, 76, 'ps4_ps5', 10),
  ('fc26-200k-ps', '200K Safe Coins', 'EA FC 26 Ultimate Team coins for PlayStation.', 200000, 16000, 140, 152, 'ps4_ps5', 20),
  ('fc26-300k-ps', '300K Safe Coins', 'EA FC 26 Ultimate Team coins for PlayStation.', 300000, 24000, 209, 227, 'ps4_ps5', 30),
  ('fc26-400k-ps', '400K Safe Coins', 'EA FC 26 Ultimate Team coins for PlayStation.', 400000, 32000, 280, 303, 'ps4_ps5', 40),
  ('fc26-500k-ps', '500K Safe Coins', 'EA FC 26 Ultimate Team coins for PlayStation.', 500000, 40000, 349, 379, 'ps4_ps5', 50),
  ('fc26-800k-ps', '800K Safe Coins', 'EA FC 26 Ultimate Team coins for PlayStation.', 800000, 64000, 559, 606, 'ps4_ps5', 60),
  ('fc26-1m-ps', '1M Safe Coins', 'EA FC 26 Ultimate Team coins for PlayStation.', 1000000, 80000, 698, 758, 'ps4_ps5', 70),
  ('fc26-1-5m-ps', '1.5M Safe Coins', 'EA FC 26 Ultimate Team coins for PlayStation.', 1500000, 120000, 1047, 1138, 'ps4_ps5', 80),
  ('fc26-2m-ps', '2M Safe Coins', 'EA FC 26 Ultimate Team coins for PlayStation.', 2000000, 160000, 1396, 1517, 'ps4_ps5', 90),
  ('fc26-3m-ps', '3M Safe Coins', 'EA FC 26 Ultimate Team coins for PlayStation.', 3000000, 240000, 2094, 2275, 'ps4_ps5', 100),
  ('fc26-4m-ps', '4M Safe Coins', 'EA FC 26 Ultimate Team coins for PlayStation.', 4000000, 320000, 2791, 3034, 'ps4_ps5', 110),
  ('fc26-5m-ps', '5M Safe Coins', 'EA FC 26 Ultimate Team coins for PlayStation.', 5000000, 400000, 3489, 3792, 'ps4_ps5', 120),
  ('fc26-6m-ps', '6M Safe Coins', 'EA FC 26 Ultimate Team coins for PlayStation.', 6000000, 480000, 4187, 4550, 'ps4_ps5', 130),
  ('fc26-7m-ps', '7M Safe Coins', 'EA FC 26 Ultimate Team coins for PlayStation.', 7000000, 560000, 4885, 5309, 'ps4_ps5', 140),
  ('fc26-8m-ps', '8M Safe Coins', 'EA FC 26 Ultimate Team coins for PlayStation.', 8000000, 640000, 5582, 6067, 'ps4_ps5', 150),
  ('fc26-10m-ps', '10M Safe Coins', 'EA FC 26 Ultimate Team coins for PlayStation.', 10000000, 800000, 6977, 7584, 'ps4_ps5', 160),
  ('fc26-15m-ps', '15M Safe Coins', 'EA FC 26 Ultimate Team coins for PlayStation.', 15000000, 1200000, 10586, 11376, 'ps4_ps5', 170),
  ('fc26-20m-ps', '20M Safe Coins', 'EA FC 26 Ultimate Team coins for PlayStation.', 20000000, 1600000, 14378, 15168, 'ps4_ps5', 180),
  ('fc26-30m-ps', '30M Safe Coins', 'EA FC 26 Ultimate Team coins for PlayStation.', 30000000, 2400000, 21962, 22752, 'ps4_ps5', 190);

-- Duplicate packs for Xbox and PC (same GBP prices — edit per platform in admin as needed)
insert into public.products
  (slug, name, description, coin_amount, bonus_coins, price_gbp_pence, compare_at_gbp_pence, platform, sort_order)
select
  replace(slug, '-ps', '-xbox'),
  name,
  replace(description, 'PlayStation', 'Xbox'),
  coin_amount,
  bonus_coins,
  price_gbp_pence,
  compare_at_gbp_pence,
  'xbox'::public.platform_type,
  sort_order
from public.products
where platform = 'ps4_ps5';

insert into public.products
  (slug, name, description, coin_amount, bonus_coins, price_gbp_pence, compare_at_gbp_pence, platform, sort_order)
select
  replace(slug, '-ps', '-pc'),
  name,
  replace(description, 'PlayStation', 'PC'),
  coin_amount,
  bonus_coins,
  price_gbp_pence,
  compare_at_gbp_pence,
  'pc'::public.platform_type,
  sort_order
from public.products
where platform = 'ps4_ps5';
