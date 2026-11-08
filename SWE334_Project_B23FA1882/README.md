# GREENROOM — Office Plant Store (SWE334)

**React (Vite + JavaScript) · Tailwind CSS · Motion · Supabase · Stripe test · GitHub · Vercel**

A plant and flower store for modern offices in Mongolia. The UI adapts the **interaction concept** from a provided 21st.dev skincare-product-shelf reference: three floating shelves, product-to-detail spring animation, responsive browsing, and an interactive cart. The cosmetics have been replaced with **original SVG plant illustrations** and Mongolian copy, care instructions and MNT prices.

## User roles and screens

- **Guest** — landing page, 12-item shelf, catalog, search by name, category and max price, sorting, pagination and details.
- **Customer** — register/login/logout/password reset, persistent cart, order placement and own order history. Order total and stock are calculated/validated server-side by an RPC.
- **Admin** — products CRUD + file preview/Storage upload, order/user/payment lists, order and revenue stats. Admin role is stored in RLS-protected `profiles.role`, not user-editable metadata.
- **Payment (requires Stripe test credentials)** — browser opens hosted test Checkout; signed Edge webhook confirms payment and changes order from `pending` to `paid`.

## 1. Run locally

```bash
git clone https://github.com/B23FA1882/SWE334_PlantStore.git
cd SWE334_PlantStore/SWE334_Project_B23FA1882
npm install
cp .env.example .env.local
# Edit .env.local with your project URL and PUBLISHABLE key
npm run dev
```

Open http://localhost:5173. On Windows PowerShell replace `cp` with `Copy-Item .env.example .env.local`.

The UI starts in **preview mode** without `.env.local`, using 12 local sample plants. That is NOT real CRUD, authentication, database or checkout. With the SQL migration and .env connected, plants come from Supabase and the application uses real queries.

## 2. Configure Supabase

1. Resume your paused Supabase project if necessary.
2. In **SQL Editor**, execute `supabase/migrations/20261108000100_initial_plantstore.sql` **one time on a clean project**; it creates eight tables, FK relationships, RLS policies, a secure `place_order` RPC, a `plant-images` Storage bucket, and 12 sample plants. Or manage it as a migration using the Supabase CLI.
3. In **Settings > API Keys**, copy the *publishable* key (NOT secret or service_role). In **Settings > API**, copy the Project URL. Put them in the client `.env.local`:

   ```env
   VITE_SUPABASE_URL=https://yourproject.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_yourkey
   ```
4. In **Authentication > URL Configuration**, set Site URL `http://localhost:5173`, and add `http://localhost:5173/**`, your Vercel address and domain as redirect URLs. Enable email/password in **Providers**. Email confirmations require deliverable SMTP settings.
5. Register one user through the website. Then, in SQL Editor **only**, grant them the admin role:

   ```sql
   update public.profiles set role = 'admin'
   where id = (select id from auth.users where email = 'YOUR_EMAIL@example.com');
   ```

6. Sign out and back in to access `/admin`. Test a product update and check **Table Editor** + **Storage**.

> Do not put `service_role`, a Stripe secret, or a webhook signing secret into a `VITE_*` variable: Vite embeds those variables in browser code.

## 3. Stripe **test mode** payments (later stage)

Requires a Stripe test account and test API secrets; not enabled by merely pushing to GitHub.

1. Configure Supabase Edge Function secrets: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` and `SITE_URL` (your site origin).
2. Deploy `create-checkout` (requires a customer JWT) and `stripe-webhook` (no Supabase JWT; **signed Stripe webhook required**). See `supabase/config.toml` for JWT policy. The webhook endpoint is `https://YOUR_REF.supabase.co/functions/v1/stripe-webhook`.
3. Add this URL under Stripe **Developers > Webhooks** (test mode), subscribe to `checkout.session.completed` and `checkout.session.async_payment_succeeded`. Copy its signing secret to Supabase.
4. Confirm an order as a customer, click **Төлбөр төлөх (Stripe test)**, use a Stripe test card, then watch `orders.status` change to `paid` and `payments` populate after a signed webhook.
5. Stripe MNT amounts are passed in minor units (`price * 100`). Check Stripe merchant-country/currency support before using real charges. This repository does **not** collect real payments.

If the Edge Functions are not deployed, order creation still works and payment remains pending. Do not manually mark an unverified payment as paid.


## Cancel an unpaid order

Click **Захиалга цуцлах** next to an unpaid order in `/orders`, then confirm.
The order disappears from the customer's active list; it is **not physically deleted**
and remains visible to the admin as `cancelled`. The database restores the
reserved stock exactly once. Paid/completed Checkout sessions cannot be cancelled.

The secured flow is **authenticated customer → cancel-order Edge Function →
expire Stripe Checkout session (if any) → service-role-only cancellation RPC**.
This avoids client-side cancellation of another user's order or resetting a
paid order. The RPC source is stored at
`supabase/sql/cancel-order-service.sql`; deploy it to a fresh project via SQL
Editor, and deploy `supabase/functions/cancel-order/index.ts` with JWT
verification enabled. Existing projects require this SQL update in addition to
the original schema. The secret key stays in Supabase Edge Function Secrets.

## 4. Vercel deployment

1. Import `B23FA1882/SWE334_PlantStore` into Vercel.
2. Set **Root Directory** to `SWE334_Project_B23FA1882`.
3. Framework Vite; Build Command `npm run build`; Output Directory `dist`.
4. Add the two `VITE_SUPABASE_...` values in Vercel **Environment Variables**; deploy.
5. Configure **Domains** for your own domain (DNS + HTTPS), update Supabase Auth redirect URLs and `SITE_URL` for checkout. `vercel.json` rewrites client-side routes to `index.html`.

## Documentation and hand-in

- [ERD (8 tables)](docs/ERD.md) — 1:N and N:M, PK/FK, RLS.
- [Wireframe + user flows](docs/WIREFRAME.md) — guest, customer and admin workflows.
- Source: `src/App.jsx` (React Router pages), `src/store/StoreProvider.jsx` (auth/data/cart), `src/components/PlantShelf.jsx` (Motion shelf), `src/components/PlantArt.jsx` (original SVG), SQL migration, two Edge Functions.
- For Defense-1: run on localhost, show Auth + RLS + real CRUD, show mobile viewport, explain how `place_order` protects prices/stock, and bring slides in both PPT and PDF formats.

## Remaining validation before production

Run `npm install && npm run build && npm run lint`. Validate email confirmation, RLS using separate users, image uploads, checkout via webhook and Vercel. The app is an **MVP**, not a verified production payment service.

Design inspiration: 21st.dev shelf interaction reference supplied for the assignment. Plant illustrations and copy are original coursework adaptations.
