# Partsy Full-Stack Project Plan

## Project summary

Partsy is a computer-parts marketplace for buyers and sellers. The application uses Next.js for the web interface and Supabase Auth, PostgreSQL, and Row Level Security (RLS) for identity and data access.

## Users and capabilities

- **Buyer:** create an account, browse and search listings, save parts, manage a cart, and submit an order request.
- **Seller:** create an account or upgrade a buyer account, publish listings, and update or remove only their own listings.
- **Visitor:** browse public listings and register or sign in.

## Architecture

1. The Next.js App Router renders the marketplace and handles interactions.
2. The browser Supabase client authenticates with the public publishable key.
3. Supabase Auth owns credentials and sessions; application profile rows reference Auth user IDs.
4. PostgreSQL stores profiles, listings, favorites, carts, and orders.
5. RLS policies enforce access in the database. UI checks are usability aids, not authorization.
6. Order requests record the buyer, line-item snapshot, total, and order status. No payment is collected.

## Database plan

| Table | Purpose | Important relationship and access rule |
|---|---|---|
| `profiles` | Display name, buyer/seller account type, and location | One profile per `auth.users` account. Users may read their own profile; only approved profile fields are editable. |
| `products` | Computer-part listings, price, condition, category, image URL, and optional seller | Seller references `auth.users`. Public read; only seller accounts may insert, update, or delete their own records. Seed catalog rows have no seller account and remain read-only to app users. |
| Starter catalog | 28 sample computer parts across all categories | Stored in `products` with a null seller ID as read-only catalog items, without inventing authenticated sellers. |
| `favorites` | Parts a signed-in buyer has saved | References the buyer profile and product. Each buyer may manage only their own favorites. |
| `cart_items` | Product and quantity selected by a buyer | References the buyer and product. Each buyer may manage only their own cart. |
| `orders` | Submitted order requests and status | Buyer owns the request; database-calculated total and order items are persisted. This is not a payment or fulfillment confirmation. |
| `order_items` | Immutable product, seller ID, quantity, and price snapshot for each request | References its order and product where applicable. Buyer can read their order; clients cannot forge totals or change administrative status. |

Database constraints should validate positive prices and quantities, allowed categories and conditions, unique buyer/product favorites and cart entries, and order statuses. Use indexes for common buyer/seller queries. Avoid storing payment credentials.

## Delivery sequence and status

1. **Foundation — done:** scaffold the Next.js App Router application and responsive marketplace UI.
2. **Identity and listing schema — implemented; hosted migration pending:** buyer/seller profiles, signup trigger, seller upgrade RPC, listings table, and seller-only listing policies are in the SQL migration.
3. **Account UI — implemented; hosted end-to-end verification pending:** buyer and seller signup choice, sign in/out, profile display, and buyer-to-seller upgrade.
4. **Listing workflow — implemented; hosted end-to-end verification pending:** create, edit, remove, and read listings, guarded by Supabase RLS.
5. **Buyer data — implemented; hosted migration pending:** persist favorites and cart quantities in Supabase and restore them on session load.
6. **Order requests — implemented; hosted migration pending:** a database RPC calculates the total from current prices, writes item snapshots atomically, and clears the cart only after a successful insert. No payment is collected.
7. **Starter catalog — implemented; hosted migration pending:** seed 28 read-only example components as public marketplace listings.
8. **Verification:** apply all three SQL migrations in timestamp order in the hosted Supabase project, register two users with different roles, exercise CRUD and denial cases, verify records in Supabase Studio, run lint/build, and capture sanitized screenshots.
9. **Presentation evidence:** prepare the defense slides, architecture/ERD, actual workflow notes, and this plan. Do not represent unexecuted tests or uninvoked skills as completed.

## Test seams and acceptance checks

- **Account seam:** signup/signin returns an authenticated session and the matching database profile/role.
- **Listing seam:** a seller can create/update/delete their listing; a second seller and buyer are denied by PostgreSQL RLS.
- **Buyer data seam:** favorites and cart survive refresh/sign-in and cannot be read or changed by another account.
- **Order seam:** valid checkout creates exactly one pending request and correct item snapshots; empty/invalid cart fails; failed order creation does not clear the cart. No payment is collected.
- **UI seam:** category/search, auth dialogs, role transition, listing validation, order confirmation and explicit errors are observable through the browser.
- **Build seam:** lint and production build complete without errors.

## Risks and boundaries

- A browser publishable/anon key is public by design. Never place a service-role key in the browser or commit `.env.local`.
- All three timestamped hosted SQL migrations must be applied in order before the full database-backed marketplace and starter catalog are available. Current visible app errors should not be dismissed as successful connectivity.
- Email confirmation behavior is configured in Supabase Auth; students must use the flow enabled by their project.
- External sample images require internet access.
- Checkout creates an order request only. Payment processing, shipping, refunds, and production-grade order operations are not included.
- The grading brief asks for self-hosted Supabase with Docker. The current `.env.local` points to hosted Supabase; a local Docker demo must be configured and tested separately to meet that requirement.
