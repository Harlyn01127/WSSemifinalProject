# Partsy

Partsy is a Next.js computer-parts marketplace. Supabase Auth handles buyer and seller sign-up/sign-in. Profiles, listings, favorites, cart quantities, and order requests persist in Supabase; PostgreSQL row-level security enforces ownership and seller-only listing access.

## Run the preview

Requirements: Node.js 20.9 or later.

```powershell
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Without Supabase environment variables, the page displays sample listings and clearly indicates preview mode. New preview listings are held in memory and reset on refresh. Product photographs are loaded from Unsplash and require an internet connection.

## Run with local Supabase

Requirements: Docker Desktop running and the Supabase CLI (included as a project dependency).

```powershell
npm install
npm run db:start
```

Copy the `API URL` and public key from the Supabase dashboard (or the `anon key` shown by `npx supabase status` for local development) into `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-public-key
```

Restart `npm run dev` after changing environment variables. Supabase CLI applies the SQL migration in `supabase/migrations/` when the local stack starts or resets. Open [http://localhost:54323](http://localhost:54323) for Supabase Studio.

For an already-hosted Supabase project, set the project URL and publishable key in `.env.local`; do not start the local Supabase stack. Run the migration files in timestamp order in the hosted project's SQL Editor:

1. `supabase/migrations/20261106000000_create_products.sql` creates profiles, the signup trigger, seller upgrade function, products, and seller/listing policies.
2. `supabase/migrations/20261106000001_create_buyer_data.sql` creates private favorites and cart tables, order requests/items, and database functions for cart quantity changes and atomic order-request submission.
3. `supabase/migrations/20261106000002_seed_marketplace_products.sql` adds 28 starter products across all marketplace categories.

## Deploy to Netlify

In Netlify, open the site's **Environment variables** settings and add these variables for every deploy context:

- `NEXT_PUBLIC_SUPABASE_URL` — the Supabase project's API URL.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — the project's publishable key. Never use a service-role or secret key here.

These `NEXT_PUBLIC_` values are included in the client bundle at build time. Trigger a new deploy after adding or changing them. Without both values, the site intentionally runs in preview mode: sign-in, account creation, and order requests are unavailable.

In the Supabase Dashboard, open **Authentication → URL Configuration**. Set **Site URL** to the deployed Netlify URL and add that site's URL to **Redirect URLs**. Also confirm email confirmation settings match the signup flow you intend to demonstrate.

Before ordering, apply all three SQL migrations above in timestamp order. Buyers must create an account or sign in before adding items to their database-backed cart and submitting an order request.

Open the app and create an account as a buyer or seller. Supabase may require email confirmation, depending on the project's Auth settings. A buyer can select **Become a seller** after signing in. Seller accounts can list and manage their own products; database policies prevent buyer accounts from writing listings. Signed-in buyers can persist saved parts and cart quantities, submit an order request with a database-calculated total and item snapshots, and review their request history. This does not collect payment.

To stop local Supabase, run `npm run db:stop`. To reset the local database and reapply migrations, run `npm run db:reset`.

Do not commit `.env.local` or use a service-role/secret key in the browser. The app accepts a Supabase publishable key (or the legacy local anon key); authorization is enforced by PostgreSQL row-level security.

## Project structure

- `docs/Partsy_Project_Plan.docx` — project plan and skills/workflow evidence for the defense.
- `docs/PROJECT_PLAN.md` — editable plan, data model, and acceptance checks.
- `docs/MATT_POCOCK_SKILLS_EVIDENCE.md` — names and honest usage record for skills consulted.
- `src/app/page.tsx` — marketplace screen, filters, cart, seller account and listing interactions.
- `src/app/page.module.css` — responsive storefront and modal styles.
- `src/app/layout.tsx` — app shell and page metadata.
- `src/lib/supabase.ts` — browser Supabase client, enabled only when the project URL and publishable (or legacy anon) key are configured.
- `supabase/config.toml` — local Supabase services and ports.
- `supabase/migrations/` — buyer/seller profiles, products, 28 starter catalog listings, favorites, cart, order requests, RPCs, and row-level security policies.

## Validation

```powershell
npm run lint
npm run build
```

## Current demo boundaries

Without Supabase configuration, the page runs a non-persistent preview. In Supabase mode, favorites, cart quantities, and non-payment order requests are database-backed. Payment processing, shipping, refunds, and production-grade order operations are not included. The listing photo field accepts an image URL (the marketplace's sample photos are externally hosted).
