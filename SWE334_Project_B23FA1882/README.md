# GREENROOM — Office Plant Store (SWE334)

**React (Vite + JavaScript) · Tailwind CSS · Motion · Supabase · QPay sandbox · GitHub · Vercel**

A plant and flower store for modern offices in Mongolia. The UI adapts the **interaction concept** from a provided 21st.dev skincare-product-shelf reference: three floating shelves, product-to-detail spring animation, responsive browsing, and an interactive cart. The cosmetics have been replaced with **original SVG plant illustrations** and Mongolian copy, care instructions and MNT prices.

## User roles and screens

- **Guest** — landing page, 12-item shelf, catalog, search by name, category and max price, sorting, pagination and details.
- **Customer** — register/login/logout/password reset, persistent cart, order placement and own order history. Order total and stock are calculated/validated server-side by an RPC.
- **Admin** — products CRUD + file preview/Storage upload, order/user/payment lists, order and revenue stats. Admin role is stored in RLS-protected `profiles.role`, not user-editable metadata.
- **Payment (requires QPay sandbox merchant credentials)** — browser displays provider QR/bank links; Edge Functions verify payments with the QPay Merchant V2 API before marking orders paid. Prior Stripe test orders remain auditable.

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

> Never put `service_role`, QPay client secret, Stripe secret or webhook secret into a `VITE_*` variable. Vite publishes those variables to browsers.

## 3. QPay Merchant V2 sandbox (from user-provided Merchant V2 Postman collection)

**Current setup:** database support + four QPay-aware Edge Functions are deployed to connected Supabase, but the uploaded Postman collection has **no merchant credentials**. The UI is ready on the feature branch. QPay is **not yet an end-to-end verified payment system** until the merchant sandbox secrets are configured and a completed sandbox transaction is checked.

Documentation: https://developer.qpay.mn/mn/docs/merchant?version=2.0.0

### Set server-only secrets (Supabase → Edge Functions → Secrets)

| Name | Value |
| --- | --- |
| `QPAY_CLIENT_ID` | Merchant sandbox client ID issued by QPay |
| `QPAY_CLIENT_SECRET` | Merchant sandbox secret issued by QPay |
| `QPAY_INVOICE_CODE` | Invoice code issued by QPay |
| `QPAY_BASE_URL` | `https://merchant-sandbox.qpay.mn` |
| `QPAY_RECEIVER_CODE` | Optional, when QPay supplies a specific code; defaults to `terminal` |

The Postman collection's `TEST_INVOICE` and receiver code `83` are examples only — **do not assume they are your merchant account credentials**.

### Database and functions

- Core database migration creates 8 tables. The additional `supabase/sql/qpay-invoices.sql` creates a 9th table with owner-only read RLS; run on fresh databases.
- `supabase/sql/qpay-confirm-payment.sql` adds a **service-role-only transactional RPC**. The user, anon, and authenticated roles cannot call it directly.
- Deploy `qpay-invoice` and `qpay-status` with JWT verification; deploy `qpay-callback` without a Supabase JWT (it calls QPay directly to verify a payment before marking paid); update `cancel-order` for QPay cancellation.
- Deploy each function with `_shared/qpay.ts` as a sibling folder; `supabase/config.toml` defines JWT policy.
- The callback URL is generated as `https://YOUR_REF.supabase.co/functions/v1/qpay-callback?order_id=<uuid>` for every invoice; QPay API receives it in the `callback_url` field. A callback by itself never marks an order paid.

### Checkout test

1. Sign in, add an active product, create a **new order** in `/cart`.
2. In `/orders`, choose `QPay-аар төлөх`. The server calls `POST /v2/invoice` and saves a QR/deeplink invoice.
3. Pay using the sandbox environment. Then press `Төлбөр шалгах`; the server calls `POST /v2/payment/check` and confirms paid amount, payment status and currency.
4. Check `orders.status='paid'`, `payments.provider='qpay'`, `qpay_invoices.status='paid'`.
5. Test an unpaid invoice cancellation; the QPay invoice is deleted before restoring product stock.
6. Check logs for duplicate notifications and payment RPC errors. Stripe test checkout functions are retained for historical sessions but not used for **new** UI checkout.

For existing unpaid Stripe orders with `payment_ref` set, first safely cancel that old test order, then create a new QPay order. Never rewrite an old payment reference manually. **Do not use real funds until the provider authorizes production and the sandbox checklist passes.**


## Cancel an unpaid order

Click **Захиалга цуцлах** next to an unpaid order in `/orders`, then confirm.
The order disappears from the customer's active list; it is **not physically deleted**
and remains visible to the admin as `cancelled`. The database restores the
reserved stock exactly once. Paid/completed Checkout sessions cannot be cancelled.

The secured flow is **authenticated customer → cancel-order Edge Function →
delete unpaid QPay invoice (or expire a legacy Stripe checkout session) → service-role-only cancellation RPC**.
This avoids client-side cancellation of another user's order or resetting a
paid order. The RPC source is stored at
`supabase/sql/cancel-order-service.sql`; deploy it to a fresh project via SQL
Editor, and deploy `supabase/functions/cancel-order/index.ts` with JWT
verification enabled. Existing projects require this SQL update in addition to
the original schema. All QPay and historical Stripe secrets remain in Supabase Edge Function Secrets.

## 4. Vercel deployment

1. Import `B23FA1882/SWE334_PlantStore` into Vercel.
2. Set **Root Directory** to `SWE334_Project_B23FA1882`.
3. Framework Vite; Build Command `npm run build`; Output Directory `dist`.
4. Add the two `VITE_SUPABASE_...` values in Vercel **Environment Variables**; deploy.
5. Configure **Domains** for your own domain (DNS + HTTPS), update Supabase Auth redirect URLs. QPay's callback uses the Supabase Edge Function public HTTPS URL. `vercel.json` rewrites client-side routes to `index.html`.

## Documentation and hand-in

- [ERD (8 core + 1 QPay invoice table)](docs/ERD.md) — 1:N and N:M, PK/FK, RLS.
- [Wireframe + user flows](docs/WIREFRAME.md) — guest, customer and admin workflows.
- Source: `src/App.jsx` (React Router pages), `src/store/StoreProvider.jsx` (auth/data/cart), `src/components/PlantShelf.jsx` (Motion shelf), `src/components/PlantArt.jsx` (original SVG), SQL migration, QPay functions plus historical Stripe functions.
- For Defense-1: run on localhost, show Auth + RLS + real CRUD, show mobile viewport, explain how `place_order` protects prices/stock, and bring slides in both PPT and PDF formats.

## Remaining validation before production

Run `npm install && npm run build && npm run lint`. Validate email confirmation, RLS using separate users, image uploads, QPay invoice QR, callback, status confirmation, cancellation, and Vercel. The app is an **MVP**, not a verified production payment service.

Design inspiration: 21st.dev shelf interaction reference supplied for the assignment. Plant illustrations and copy are original coursework adaptations.

**SWE334 Бие даалт 2 (portfolio)** will be developed in a **separate repository and Vercel project**. GREENROOM remains the plant store only; no portfolio page is included in this branch.
