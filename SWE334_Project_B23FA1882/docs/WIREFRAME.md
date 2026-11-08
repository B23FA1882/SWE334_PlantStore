# GREENROOM — Wireframe + user flows

## Visitor → catalog → detail → cart
```
┌────────────────────────────────────────────────────────────────────┐
│ GREENROOM.             Нүүр Ургамлууд Бидний тухай       👤  🛍 │
├────────────────────────────────────────────────────────────────────┤
│                      Bring nature inside.                          │
│           Ажлын орчинд тохирох оффисын ургамал                     │
│                    [Ургамлууд үзэх]                                │
├────────────────────────────────────────────────────────────────────┤
│ The living shelf.                                                   │
│      🌿             🪴            🌱            🌵               │
│ ───────────────────  floating shelf  ───────────────────────────   │
│    name + price   name + price  name + price   name + price         │
│          ... 3 shelves × 4 products / horizontally scrollable ... │
├────────────────────────────────────────────────────────────────────┤
│ Plant detail (overlay / /plant/:slug)                               │
│    [large animated plant]    Name · Price · Light · Water          │
│                              [-] Qty [+] [Add to bag]              │
│                              Details / Care / Delivery            │
├────────────────────────────────────────────────────────────────────┤
│ /cart: items + quantities | delivery phone/address + order submit  │
└────────────────────────────────────────────────────────────────────┘
```

## Registered customer
`/auth` → sign up or login → `/shop` → `/cart` → `place_order` RPC → `/orders` (pending) → Stripe test checkout → webhook → paid.

## Administrator
Admin role is granted in SQL (not self-service). `/admin` → product form (create/edit/delete + image preview/storage upload) → orders/users/payments tables + metrics.

## Screens to capture for Defense-1
1. Home page: three shelves, responsive mobile view.
2. Catalog with search, category, price, sort, pagination.
3. Product overlay with quantity and add-to-cart.
4. Sign-up/login; Supabase auth user visible in dashboard.
5. Product CRUD form & DB rows changed live.
6. Supabase Table Editor: ERD eight tables, RLS enabled.
