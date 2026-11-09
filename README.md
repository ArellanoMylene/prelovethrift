# Pre-Loved Thrift

Ionic + Vue storefront with buyer, seller, and rider roles. Application data and authentication are hosted by Supabase (PostgreSQL + Supabase Auth).

## 1. Create the Supabase project

1. Create a project at <https://supabase.com>.
2. Open the SQL editor and run the SQL files in `supabase/migrations` in order, or run them with the Supabase CLI (`supabase db push`).
3. Copy `.env.example` to `.env` and fill in the project URL and anon key from **Project Settings → API**.
4. Restart `npm run dev` after creating or changing `.env`.

```bash
npm install
npm run dev
```

## 2. Enable Google sign-in

1. In Supabase, open **Authentication → Providers → Google** and enable the provider.
2. Create an OAuth client in Google Cloud Console and add the Supabase callback URL shown by Supabase.
3. Add your app URL (for local development, `http://localhost:5173`) to **Authentication → URL Configuration → Redirect URLs**.
4. The login modals call `supabase.auth.signInWithOAuth({ provider: 'google' })`. Email/password signup keeps working without Google.

Supabase applies the database migration so that creating an account creates a row in `profiles`. Google users who sign in from the seller or rider form choose that role once; after that the role is locked. Google users who sign in directly default to the buyer role.

## 3. Roles and access

| Role | Access |
| --- | --- |
| `buyer` | Storefront, cart, wishlist, own orders, order messages, profile |
| `seller` | Seller dashboard, own inventory, all shop orders (co-op shop), rider assignment, fulfilment status |
| `rider` | Rider portal, only orders assigned to that rider, delivery proof, customer messages, profile |

Roles are stored in `profiles.role`. Row-level security enforces the same rules in PostgreSQL, not only in the UI. A Supabase session can only have one role at a time; sign out before switching accounts.

## 4. Application data

- `profiles` — auth-linked names, role, phone, address, avatar
- `house_products` — the six curated storefront products seeded by the migration
- `products` — seller inventory
- `cart_items` / `wishlist_items` — per-user shopping data
- `orders` / `order_items` / `order_messages` — order records, validated line items, and chat
- `product_reviews` — customer reviews using the existing `id`, `product_id`, `user_id`, `rating`, `review_text`, `seller_service_rating`, `delivery_service_rating`, `show_username`, `photo_urls`, `video_urls`, and `created_at` columns
- `seller_activity` — seller automation/activity log

Product reviews use the existing Supabase table schema. Run `supabase/migrations/0002_product_reviews_rls.sql` in the Supabase SQL Editor to enable buyer review inserts and buyer/seller review reads. Small review photos and videos are saved as data URLs in the JSONB `photo_urls` and `video_urls` columns, so no Storage bucket is required.

Order totals, shipping, item prices, and stock changes are recalculated/validated by database triggers. The current shipping rule is ₱261, free over ₱2,900. Placing an order decrements seller stock and increments units sold; if Auto-reorder is enabled and stock reaches or falls below the reorder point, the trigger restocks to `reorder_point + 10`. Enabling Auto-reorder for an already-low-stock product also replenishes it immediately. Run `supabase/migrations/0003_auto_reorder.sql` in the Supabase SQL Editor to install or refresh these triggers. A new seller gets the curated products copied into their inventory once, via the `seed_my_seller_inventory()` function.

The seller Sales Analytics card ranks the seller's dress inventory by the `products.sold` count and shows unsold dresses separately. Manual restock requests are saved to the existing `reorder_requests` table with the product ID, stock at request time, and reorder point; the database supplies the request's default status. Run `supabase/migrations/0004_reorder_requests_rls.sql` in the Supabase SQL Editor to allow sellers to create and view requests for their own products.

## 5. Prices and currency

Prices are displayed and stored in Philippine pesos (PHP). No exchange-rate conversion is applied.

## 6. GCash QR checkout

GCash checkout is not enabled until the seller adds their official QR image at `public/assets/gcash-qr.png`. Use only a QR issued by the seller's GCash account; do not generate or edit a payment QR. Buyers scan the QR and place the order, then the seller must verify the transfer manually before confirming payment. This static QR flow does not verify payments automatically.

## 7. Notes

- Seller orders are visible to every seller account because the shop is modelled as one co-op storefront. Change the `orders_select`/`orders_update` policies if you need strict per-seller isolation.
- There is no real payment capture, courier integration, or admin console.
- If Supabase environment variables are missing, the app renders a configuration warning and account actions explain what is missing.
