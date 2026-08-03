/**
 * Seed realistic demo data for admin UI testing.
 *
 * Usage (from repo root):
 *   node supabase/seed_demo.js
 *   node supabase/seed_demo.js --force   # wipe prior demo rows, then re-seed
 *
 * Requires backend/.env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Optional: DATABASE_URL (used only if you prefer pg; not required)
 *
 * Demo customers sign in with password: DemoPass123!
 * Emails use @coinempire.demo so they stay easy to spot / clear.
 */

const path = require('path');
const { createClient } = require('../backend/node_modules/@supabase/supabase-js');

require('../backend/node_modules/dotenv').config({
  path: path.join(__dirname, '../backend/.env'),
  quiet: true,
});

const FORCE = process.argv.includes('--force');
const DEMO_PASSWORD = 'DemoPass123!';
const DEMO_DOMAIN = 'coinempire.demo';
const ORDER_PREFIX = 'CE-DEMO-';

const CUSTOMERS = [
  { email: `alex.morgan@${DEMO_DOMAIN}`, fullName: 'Alex Morgan', daysAgo: 52 },
  { email: `jordan.lee@${DEMO_DOMAIN}`, fullName: 'Jordan Lee', daysAgo: 45 },
  { email: `sam.patel@${DEMO_DOMAIN}`, fullName: 'Sam Patel', daysAgo: 38 },
  { email: `casey.brooks@${DEMO_DOMAIN}`, fullName: 'Casey Brooks', daysAgo: 31 },
  { email: `riley.nguyen@${DEMO_DOMAIN}`, fullName: 'Riley Nguyen', daysAgo: 24 },
  { email: `morgan.diaz@${DEMO_DOMAIN}`, fullName: 'Morgan Diaz', daysAgo: 18 },
  { email: `jamie.okafor@${DEMO_DOMAIN}`, fullName: 'Jamie Okafor', daysAgo: 12 },
  { email: `taylor.chen@${DEMO_DOMAIN}`, fullName: 'Taylor Chen', daysAgo: 7 },
  { email: `avery.smith@${DEMO_DOMAIN}`, fullName: 'Avery Smith', daysAgo: 3 },
  { email: `quinn.wilson@${DEMO_DOMAIN}`, fullName: 'Quinn Wilson', daysAgo: 1 },
];

/** Relative day offsets + status mix for dashboard charts / status filters */
const ORDER_SPECS = [
  // Today
  { daysAgo: 0, hours: 2, status: 'pending_payment', platform: 'ps4_ps5', guest: true },
  { daysAgo: 0, hours: 5, status: 'paid', platform: 'xbox', qty: 2 },
  { daysAgo: 0, hours: 8, status: 'processing', platform: 'pc' },
  // This week
  { daysAgo: 1, status: 'delivered', platform: 'ps4_ps5', qty: 2 },
  { daysAgo: 1, status: 'paid', platform: 'xbox' },
  { daysAgo: 2, status: 'processing', platform: 'ps4_ps5' },
  { daysAgo: 2, status: 'cancelled', platform: 'pc', guest: true },
  { daysAgo: 3, status: 'delivered', platform: 'xbox', qty: 3 },
  { daysAgo: 4, status: 'paid', platform: 'ps4_ps5' },
  { daysAgo: 5, status: 'refunded', platform: 'pc' },
  { daysAgo: 6, status: 'delivered', platform: 'ps4_ps5', qty: 2 },
  // Prior weeks (current 30d window)
  { daysAgo: 8, status: 'delivered', platform: 'xbox' },
  { daysAgo: 9, status: 'paid', platform: 'pc', qty: 2 },
  { daysAgo: 10, status: 'processing', platform: 'ps4_ps5' },
  { daysAgo: 11, status: 'pending_payment', platform: 'xbox', guest: true },
  { daysAgo: 12, status: 'delivered', platform: 'pc' },
  { daysAgo: 13, status: 'paid', platform: 'ps4_ps5', qty: 2 },
  { daysAgo: 14, status: 'cancelled', platform: 'xbox' },
  { daysAgo: 15, status: 'delivered', platform: 'ps4_ps5' },
  { daysAgo: 16, status: 'refunded', platform: 'pc', guest: true },
  { daysAgo: 18, status: 'paid', platform: 'xbox', qty: 2 },
  { daysAgo: 20, status: 'delivered', platform: 'ps4_ps5', qty: 3 },
  { daysAgo: 21, status: 'processing', platform: 'pc' },
  { daysAgo: 22, status: 'paid', platform: 'ps4_ps5' },
  { daysAgo: 24, status: 'delivered', platform: 'xbox' },
  { daysAgo: 26, status: 'pending_payment', platform: 'pc' },
  { daysAgo: 27, status: 'paid', platform: 'ps4_ps5', qty: 2 },
  { daysAgo: 28, status: 'delivered', platform: 'xbox' },
  { daysAgo: 29, status: 'refunded', platform: 'ps4_ps5' },
  // Prior period (for % change KPIs — 30–55 days ago)
  { daysAgo: 32, status: 'delivered', platform: 'pc', qty: 2 },
  { daysAgo: 35, status: 'paid', platform: 'ps4_ps5' },
  { daysAgo: 38, status: 'delivered', platform: 'xbox' },
  { daysAgo: 40, status: 'cancelled', platform: 'pc', guest: true },
  { daysAgo: 42, status: 'delivered', platform: 'ps4_ps5', qty: 2 },
  { daysAgo: 45, status: 'paid', platform: 'xbox' },
  { daysAgo: 48, status: 'delivered', platform: 'pc' },
  { daysAgo: 50, status: 'refunded', platform: 'ps4_ps5' },
  { daysAgo: 52, status: 'delivered', platform: 'xbox', qty: 2 },
  { daysAgo: 55, status: 'paid', platform: 'pc' },
];

function daysAgoIso(days, hours = 12) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  d.setUTCHours(hours, Math.floor(Math.random() * 50), Math.floor(Math.random() * 50), 0);
  return d.toISOString();
}

function orderNumber(index) {
  const stamp = (Date.now() + index).toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${ORDER_PREFIX}${stamp}-${rand}`;
}

function pick(arr, i) {
  return arr[i % arr.length];
}

function createClientAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in backend/.env');
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function clearDemoData(supabase, demoEmails) {
  console.log('Clearing previous demo data (--force)...');

  const { data: demoOrders, error: oe } = await supabase
    .from('orders')
    .select('id')
    .like('order_number', `${ORDER_PREFIX}%`);
  if (oe) throw oe;

  if (demoOrders?.length) {
    const ids = demoOrders.map((o) => o.id);
    await supabase.from('order_items').delete().in('order_id', ids);
    await supabase.from('orders').delete().in('id', ids);
    console.log(`  removed ${ids.length} demo orders`);
  }

  const { error: phe } = await supabase
    .from('price_history')
    .delete()
    .like('note', '[demo]%');
  if (phe) throw phe;

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email')
    .in('email', demoEmails);

  for (const p of profiles || []) {
    const { error } = await supabase.auth.admin.deleteUser(p.id);
    if (error) console.warn(`  warn deleting ${p.email}:`, error.message);
    else console.log(`  removed user ${p.email}`);
  }
}

async function ensureCustomers(supabase) {
  const byEmail = new Map();
  const { data: listed, error: listErr } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listErr) throw listErr;
  const existingByEmail = new Map(
    (listed?.users || []).map((u) => [u.email?.toLowerCase(), u]),
  );

  for (const c of CUSTOMERS) {
    const existing = existingByEmail.get(c.email.toLowerCase());

    let userId;
    if (existing) {
      userId = existing.id;
      console.log(`  customer exists: ${c.email}`);
    } else {
      const { data, error } = await supabase.auth.admin.createUser({
        email: c.email,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: c.fullName },
      });
      if (error) throw new Error(`createUser ${c.email}: ${error.message}`);
      userId = data.user.id;
      console.log(`  created customer: ${c.email}`);
    }

    const createdAt = daysAgoIso(c.daysAgo, 10);
    const { error: pe } = await supabase
      .from('profiles')
      .update({
        full_name: c.fullName,
        role: 'customer',
        created_at: createdAt,
        updated_at: createdAt,
      })
      .eq('id', userId);
    if (pe) throw pe;

    byEmail.set(c.email, userId);
  }

  return byEmail;
}

async function loadProducts(supabase) {
  const { data, error } = await supabase
    .from('products')
    .select(
      'id, slug, name, coin_amount, bonus_coins, price_gbp_pence, platform, is_active',
    )
    .eq('is_active', true)
    .order('sort_order');
  if (error) throw error;
  if (!data?.length) {
    throw new Error('No products found. Run supabase/seed.sql (or node supabase/apply.js) first.');
  }

  const byPlatform = { ps4_ps5: [], xbox: [], pc: [] };
  for (const p of data) {
    if (byPlatform[p.platform]) byPlatform[p.platform].push(p);
  }
  return byPlatform;
}

async function seedOrders(supabase, customersByEmail, productsByPlatform) {
  const customerIds = [...customersByEmail.values()];
  const guestEmails = [
    'guest.buyer1@example.com',
    'guest.buyer2@example.com',
    'fifa.fan99@example.com',
    'ut.coins.buyer@example.com',
  ];

  let created = 0;

  for (let i = 0; i < ORDER_SPECS.length; i++) {
    const spec = ORDER_SPECS[i];
    const platformProducts = productsByPlatform[spec.platform] || [];
    if (!platformProducts.length) {
      console.warn(`  skip order ${i}: no products for ${spec.platform}`);
      continue;
    }

    // Prefer mid-tier packs so top-products chart is interesting
    const mid = Math.floor(platformProducts.length / 3);
    const primary = platformProducts[mid + (i % 5)] || platformProducts[i % platformProducts.length];
    const qty = spec.qty || 1;
    const items = [
      {
        product: primary,
        quantity: qty,
      },
    ];
    if (i % 4 === 0 && platformProducts.length > 1) {
      const secondary =
        platformProducts[(mid + 3 + i) % platformProducts.length];
      if (secondary.id !== primary.id) {
        items.push({ product: secondary, quantity: 1 });
      }
    }

    const subtotal = items.reduce(
      (sum, it) => sum + it.product.price_gbp_pence * it.quantity,
      0,
    );
    const createdAt = daysAgoIso(spec.daysAgo, spec.hours ?? 11 + (i % 8));
    const isPaidLike = ['paid', 'processing', 'delivered', 'refunded'].includes(
      spec.status,
    );
    const isDelivered = spec.status === 'delivered';

    let userId = null;
    let guestEmail = null;
    if (spec.guest) {
      guestEmail = pick(guestEmails, i);
    } else {
      userId = pick(customerIds, i);
    }

    const whatsapp = `+4477${String(10000000 + i).slice(0, 8)}`;
    const gameEmail = guestEmail || `ea.account${i}@example.com`;

    const row = {
      order_number: orderNumber(i),
      user_id: userId,
      guest_email: guestEmail,
      status: spec.status,
      platform: spec.platform,
      subtotal_gbp_pence: subtotal,
      total_gbp_pence: subtotal,
      currency: 'gbp',
      delivery_notes: i % 5 === 0 ? 'Please deliver after 8pm UK time.' : null,
      game_account_email: gameEmail,
      customer_whatsapp: whatsapp,
      admin_notes:
        spec.status === 'processing'
          ? 'Coins queued — waiting for trader slot.'
          : spec.status === 'refunded'
            ? 'Customer reported wrong platform; refund issued.'
            : null,
      paid_at: isPaidLike ? createdAt : null,
      delivered_at: isDelivered
        ? daysAgoIso(Math.max(0, spec.daysAgo - 1), 16)
        : null,
      stripe_checkout_session_id: isPaidLike
        ? `cs_test_demo_${i}_${Date.now().toString(36)}`
        : null,
      stripe_payment_intent_id: isPaidLike
        ? `pi_test_demo_${i}_${Date.now().toString(36)}`
        : null,
      created_at: createdAt,
      updated_at: createdAt,
    };

    const { data: order, error } = await supabase
      .from('orders')
      .insert(row)
      .select('id')
      .single();
    if (error) throw new Error(`order insert ${i}: ${error.message}`);

    const itemRows = items.map((it) => ({
      order_id: order.id,
      product_id: it.product.id,
      product_name: it.product.name,
      coin_amount: it.product.coin_amount,
      bonus_coins: it.product.bonus_coins,
      unit_price_gbp_pence: it.product.price_gbp_pence,
      quantity: it.quantity,
      created_at: createdAt,
    }));

    const { error: ie } = await supabase.from('order_items').insert(itemRows);
    if (ie) throw new Error(`order_items ${i}: ${ie.message}`);
    created += 1;
  }

  console.log(`  created ${created} demo orders`);
}

async function seedPriceHistory(supabase, productsByPlatform, adminId) {
  const samples = [
    {
      platform: 'ps4_ps5',
      index: 6,
      oldDelta: 40,
      note: '[demo] Weekend promo — matched LootBar',
      daysAgo: 2,
    },
    {
      platform: 'ps4_ps5',
      index: 10,
      oldDelta: -80,
      note: '[demo] Raised after supplier cost increase',
      daysAgo: 5,
    },
    {
      platform: 'xbox',
      index: 4,
      oldDelta: 25,
      note: '[demo] Xbox flash sale',
      daysAgo: 8,
    },
    {
      platform: 'pc',
      index: 8,
      oldDelta: -50,
      note: '[demo] PC demand bump',
      daysAgo: 12,
    },
    {
      platform: 'ps4_ps5',
      index: 2,
      oldDelta: 15,
      note: '[demo] Entry pack adjustment',
      daysAgo: 20,
    },
    {
      platform: 'xbox',
      index: 12,
      oldDelta: -120,
      note: '[demo] High-tier margin restore',
      daysAgo: 27,
    },
  ];

  const rows = [];
  for (const s of samples) {
    const list = productsByPlatform[s.platform] || [];
    const product = list[s.index] || list[0];
    if (!product) continue;
    rows.push({
      product_id: product.id,
      old_price_gbp_pence: Math.max(10, product.price_gbp_pence + s.oldDelta),
      new_price_gbp_pence: product.price_gbp_pence,
      changed_by: adminId,
      note: s.note,
      created_at: daysAgoIso(s.daysAgo, 14),
    });
  }

  if (!rows.length) return;
  const { error } = await supabase.from('price_history').insert(rows);
  if (error) throw new Error(`price_history: ${error.message}`);
  console.log(`  created ${rows.length} price_history rows`);
}

async function deactivateOneProduct(supabase, productsByPlatform) {
  // Leave one inactive pack so Products admin can show inactive filter/state
  const pc = productsByPlatform.pc || [];
  const target = pc[pc.length - 1];
  if (!target) return;
  const { error } = await supabase
    .from('products')
    .update({ is_active: false })
    .eq('id', target.id);
  if (error) throw error;
  console.log(`  deactivated product for UI testing: ${target.slug}`);
}

async function main() {
  const supabase = createClientAdmin();
  const demoEmails = CUSTOMERS.map((c) => c.email);

  console.log('CoinEmpire admin demo seed');
  console.log(`force=${FORCE}`);

  const { count: productCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true });
  console.log(`products in DB: ${productCount}`);
  if (!productCount) {
    throw new Error('Seed products first: node supabase/apply.js  (or run seed.sql)');
  }

  const { data: existingDemoOrders } = await supabase
    .from('orders')
    .select('id')
    .like('order_number', `${ORDER_PREFIX}%`)
    .limit(1);

  if (existingDemoOrders?.length && !FORCE) {
    console.log(
      'Demo orders already present. Re-run with --force to wipe and re-seed.',
    );
    return;
  }

  if (FORCE) {
    await clearDemoData(supabase, demoEmails);
  }

  console.log('Ensuring demo customers...');
  const customersByEmail = await ensureCustomers(supabase);

  const { data: admins } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('role', 'admin')
    .limit(1);
  const adminId = admins?.[0]?.id || null;
  if (!adminId) {
    console.warn('No admin profile found — price_history.changed_by will be null');
  } else {
    console.log(`using admin for price history: ${admins[0].email}`);
  }

  console.log('Loading products...');
  const productsByPlatform = await loadProducts(supabase);

  console.log('Seeding orders...');
  await seedOrders(supabase, customersByEmail, productsByPlatform);

  console.log('Seeding price history...');
  await seedPriceHistory(supabase, productsByPlatform, adminId);

  console.log('Tweaking products...');
  await deactivateOneProduct(supabase, productsByPlatform);

  const { count: orders } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true });
  const { count: customers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'customer');
  const { count: history } = await supabase
    .from('price_history')
    .select('*', { count: 'exact', head: true });

  console.log('\nDone. Totals:');
  console.log(`  orders: ${orders}`);
  console.log(`  customers: ${customers}`);
  console.log(`  price_history: ${history}`);
  console.log('\nDemo customer login:');
  console.log(`  email: alex.morgan@${DEMO_DOMAIN} (or any @${DEMO_DOMAIN})`);
  console.log(`  password: ${DEMO_PASSWORD}`);
  console.log('Open /admin while signed in as an admin to review dashboard, orders, users, products.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
