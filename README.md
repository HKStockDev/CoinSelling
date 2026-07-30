# CoinEmpire MVP

Coins-only e-commerce MVP for selling **EA FC 26 Ultimate Team coins** in **GBP**, inspired by futcoinsempire-style stores but with its own brand.

## Stack

| Layer | Tech |
| --- | --- |
| Frontend | Next.js (App Router) + Tailwind |
| Backend | NestJS REST API |
| Database / Auth | Supabase (Postgres + Auth) |
| Payments | Stripe Checkout (`currency: gbp`) |

## What's included

- Product catalogue by platform (PlayStation / Xbox / PC)
- Cart + Stripe checkout in GBP
- Guest or logged-in checkout
- User accounts + order history
- Admin panel for **seasonal price edits**, order status, customers
- WhatsApp support CTA: **07307 318243** (`wa.me/447307318243`)
- English copy, responsive layout, basic SEO (`metadata`, `sitemap`, `robots`)

Seed prices follow LootBar FC26 pack tiers, converted roughly to GBP (~0.79). Edit anytime in **Admin → Prices**.

## Project layout

```
CoinSelling/
  frontend/          Next.js storefront
  backend/           NestJS API
  supabase/
    migrations/      Schema + RLS
    seed.sql         FC26 coin packs
```

## Setup

### 1. Supabase

1. Create a Supabase project.
2. Run `supabase/migrations/001_init.sql` in the SQL editor.
3. Run `supabase/seed.sql`.
4. Create your first user from the storefront **Account** page (or Auth dashboard).
5. Promote to admin:

```sql
update public.profiles
set role = 'admin'
where email = 'you@example.com';
```

### 2. Stripe

1. Create a Stripe account and get test secret key.
2. Create a webhook endpoint pointing to:
   `https://YOUR_API_HOST/api/payments/webhook`
3. Subscribe to `checkout.session.completed`.
4. Copy the webhook signing secret.

### 3. Backend

```bash
cd backend
cp .env.example .env
# fill SUPABASE_* and STRIPE_* values
npm install
npm run start:dev
```

API: `http://localhost:3001/api/health`

### 4. Frontend

```bash
cd frontend
cp .env.example .env.local
# fill NEXT_PUBLIC_* values
npm install
npm run dev
```

Storefront: `http://localhost:3000`

## Key env vars

**Backend `.env`**

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `FRONTEND_URL=http://localhost:3000`

**Frontend `.env.local`**

- `NEXT_PUBLIC_API_URL=http://localhost:3001/api`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL=http://localhost:3000`

## Buying flow

1. Customer opens `/buy`, picks platform + pack.
2. Cart → Checkout (email / EA account / WhatsApp optional).
3. NestJS creates order + Stripe Checkout Session (GBP).
4. Stripe webhook marks order `paid`.
5. Admin marks `processing` → `delivered` and can message via WhatsApp.

## Notes for the client brief

- Coins only (no player cards).
- Prices are easy to change every season from Admin.
- Contact WhatsApp updated to **07307318243**.
- Payments intended for UK/GBP via Stripe.

## Out of scope for this MVP (next iterations)

- Automated in-game delivery bots
- Multi-currency / FX
- Email transactional templates
- CMS / blog
- Full inventory / stock ledger
