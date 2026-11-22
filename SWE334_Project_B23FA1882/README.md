# GREENROOM — Office Plant Store (SWE334)

**React (Vite + JavaScript) · Tailwind CSS · Motion · Supabase · QPay sandbox · GitHub · Vercel**

A plant and flower store for modern offices in Mongolia. The UI adapts the **interaction concept** from a provided 21st.dev skincare-product-shelf reference: three floating shelves, product-to-detail spring animation, responsive browsing, and an interactive cart. The cosmetics have been replaced with **original SVG plant illustrations** and Mongolian copy, care instructions and MNT prices.

## User roles and screens

- **Guest** — landing page, 12-item shelf, catalog, search by name, category and max price, sorting, pagination and details.
- **Customer** — register/login/logout/password reset, persistent cart, order placement and own order history. Order total and stock are calculated/validated server-side by an RPC.
- **Admin** — products CRUD + file preview/Storage upload, order/user/payment lists, order and revenue stats. Admin role is stored in RLS-protected `profiles.role`, not user-editable metadata.
- **QPay (sandbox credentials required)** — authenticated customer receives QPay QR/bank links, backend verifies payments directly with QPay Merchant V2, then marks order as paid. Existing Stripe functions are retained for historical pending test orders only.
- **Portfolio (SWE334 assignment 2)** — creative, responsive Mongolian portfolio at `/portfolio` with about, skills, three project cards and contacts. Personal fields must be reviewed before public submission.

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

> Do not put `service_role` or any QPay/Stripe merchant credentials into a `VITE_*` variable: Vite embeds those variables in browser code.

## 3. QPay Merchant V2 sandbox — Монгол төгрөгийн QR төлбөр

**QPay merchant sandbox credentials are NOT stored in this repository.** Request a sandbox merchant account from QPay and obtain a merchant **client ID**, **client secret**, and **invoice code**. QPay's official guide: https://developer.qpay.mn/mn/docs/merchant?version=2.0.0.

1. In Supabase SQL Editor, run `supabase/sql/qpay-invoices.sql` once on the existing GREENROOM DB (adds a **9th table** with owner-only read RLS). On a clean database, run the original migration first.
2. In Supabase **Edge Functions → Secrets**, configure these server-only values:
   - `QPAY_CLIENT_ID` — QPay merchant client ID.
   - `QPAY_CLIENT_SECRET` — QPay merchant secret.
   - `QPAY_INVOICE_CODE` — your merchant invoice code.
   - `QPAY_BASE_URL` = `https://merchant-sandbox.qpay.mn` (sandbox; never switch to production until the merchant is approved).
   - `QPAY_RECEIVER_CODE` — only if QPay assigned a different receiver code (the sample defaults to `terminal`).
3. Deploy `qpay-invoice` (authenticated), `qpay-status` (authenticated), `qpay-callback` (**public URL**, verified with QPay server-side), and the updated `cancel-order` function. Their source is in `supabase/functions/`; deployment JWT settings in `supabase/config.toml`. Use the Supabase Dashboard or CLI for deployment; include `_shared/qpay.ts`.
4. QPay callback URL is generated automatically from Supabase `SUPABASE_URL`, e.g. `https://YOUR_REF.supabase.co/functions/v1/qpay-callback?order_id=...`. Do **not** expose QPay credentials in the frontend or manually call the callback to mark payments paid.
5. Create a **new** order, click **QPay-аар төлөх**, display QR and bank links returned by QPay, then use **Төлбөр шалгах** after sandbox payment. Check `orders.status='paid'` and `payments.provider='qpay'`. Test QPay callback delivery and cancellation independently.

The legacy `create-checkout` and `stripe-webhook` Edge Functions are retained so previously created Stripe test orders can be handled during transition. Existing Stripe `payment_ref` orders cannot be converted to QPay; create a new order (or safely cancel an unpaid old one). QPay status checking is **manual**, not aggressive polling. Never mark an order paid solely from user input or callback parameters.

**NOT LIVE:** Until QPay grants merchant sandbox credentials and full paid/cancel/refund checks pass, this is a QPay **integration implementation**, not a verified working payment system.


## Cancel an unpaid order

Click **Захиалга цуцлах** next to an unpaid order in `/orders`, then confirm.
The order disappears from the customer's active list; it is **not physically deleted**
and remains visible to the admin as `cancelled`. The database restores the
reserved stock exactly once. Paid/completed Checkout sessions cannot be cancelled.

The secured flow is **authenticated customer → cancel-order Edge Function →
expire/void the corresponding QPay invoice (or historical Stripe session) → service-role-only cancellation RPC**.
This avoids client-side cancellation of another user's order or resetting a
paid order. The RPC source is stored at
`supabase/sql/cancel-order-service.sql`; deploy it to a fresh project via SQL
Editor, and deploy `supabase/functions/cancel-order/index.ts` with JWT
verification enabled. Existing projects require this SQL update in addition to
the original schema. QPay and historical Stripe secrets stay in Supabase Edge Function Secrets.

## 4. Vercel deployment

1. Import `B23FA1882/SWE334_PlantStore` into Vercel.
2. Set **Root Directory** to `SWE334_Project_B23FA1882`.
3. Framework Vite; Build Command `npm run build`; Output Directory `dist`.
4. Add the two `VITE_SUPABASE_...` values in Vercel **Environment Variables**; deploy.
5. Configure **Domains** for your own domain (DNS + HTTPS), update Supabase Auth redirect URLs. QPay callback uses the Supabase Function's public HTTPS URL. `vercel.json` rewrites client-side routes to `index.html`.

## Documentation and hand-in

- [ERD (8 core tables)](docs/ERD.md) — 1:N and N:M, PK/FK, RLS. **QPay adds a 9th supporting table:** `qpay_invoices`, linked 1:1 to `orders`; update the ERD slide before final defense.
- [Wireframe + user flows](docs/WIREFRAME.md) — guest, customer and admin workflows.
- Source: `src/App.jsx` (React Router pages), `src/store/StoreProvider.jsx` (auth/data/cart), `src/components/PlantShelf.jsx` (Motion shelf), `src/components/PlantArt.jsx` (original SVG), SQL migration, QPay and legacy Stripe Edge Functions.
- For Defense-1: run on localhost, show Auth + RLS + real CRUD, show mobile viewport, explain how `place_order` protects prices/stock, and bring slides in both PPT and PDF formats.

## Remaining validation before production

Run `npm install && npm run build && npm run lint`. Validate email confirmation, RLS using separate users, image uploads, QPay sandbox callback and server-side payment verification, cancellation and Vercel. The app is an **MVP**, not a verified production payment service.

Design inspiration: 21st.dev shelf interaction reference supplied for the assignment. Plant illustrations and copy are original coursework adaptations.

## 5. SWE334 Бие даалт 2 — Хувийн портфолио

Open `/portfolio` (e.g. `https://swe-334-plant-store.vercel.app/portfolio`). It contains:
- Танилцуулга + нэг өгүүлбэрийн уриа
- Миний тухай + эзэмшсэн технологи
- 3 төслийн карт + тайлбар + холбоос
- Холбоо барих (имэйл, GitHub)
- Responsive layout, dark/light theme, project filtering, small interactive easter egg.

**Before sharing publicly**, edit `src/components/Portfolio.jsx`:
1. Set `person.name`, `person.headline`, `person.statement`, `person.about`.
2. Replace `your-email@example.com` with **only an address you consent to publish**.
3. Replace the DATA QUALITY LAB generic repository listing URL with a direct public project artifact/repository URL and review all project descriptions.
4. Test mobile, verify external links, and credit external assets in README.

The SWE334 Bие даалт 2 PDF requires an **independent personal portfolio site under your own name** and a public link. A `/portfolio` route inside GREENROOM is a starting point only; if your instructor expects a separate domain/product, deploy this page as an independently branded portfolio before submission. The assignment requires a 2-minute live tour + 1-minute code question; no PPT.
