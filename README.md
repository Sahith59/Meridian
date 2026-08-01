# Meridian

A small, deliberately-vulnerable online store, built to test BoLD's **live SDK monitoring**
mode. It's the same idea as Vaultly (`/Users/abhi/BOLD/vaultly/`), re-themed as e-commerce
because that's the exact shape of BoLD's own homepage teaching example - `GET /invoice/104` →
change one digit → `GET /invoice/105` → you're reading a stranger's order. Every private-data
route exists in a **vulnerable/secured pair**, so BoLD's live pipeline can be watched both
catching real bugs and correctly clearing the secured ones, side by side.

## What it is

Two independent stores - **Northwind Traders** and **Bluebird Goods** - with customers, staff,
and 11 real orders, each backed by a genuine itemized `.txt` receipt (items, subtotal, shipping,
tax, shipping address, masked card number - the math actually adds up).

| Family | Vulnerable route | Secured route |
|---|---|---|
| BOLA (object-level) | `GET/PUT/DELETE /api/orders/[id]` | `GET /api/orders/[id]/secure` |
| BFLA (function-level) | `GET /api/admin/orders` | `GET /api/admin/orders/secure` |
| BOPLA (mass assignment) | `PATCH /api/profile` | `PATCH /api/profile/secure` |
| Tenant isolation | `GET /api/stores/[storeId]/orders/[id]` | `.../secure` |
| Missing authorization | `GET /api/orders/[id]/receipt` | `GET /api/orders/[id]/invoice` |
| Supabase RLS | `GET /api/supabase-documents/[id]` | `GET /api/supabase-notes/self` |
| FastAPI BOLA subservice | `services/fastapi-orders` | `GET /api/orders/[id]/secure` |
| (public, must never be flagged) | `GET /api/storefront` | - |

## Run it

```bash
cd meridian
npm install
cp .env.local.example .env.local   # fill in BOLD_INGEST_URL / BOLD_INGEST_KEY, see below
npm run dev
```

Open `http://localhost:3000`, sign in with a demo account, and click around - this generates
clean, normal traffic for BoLD to see as a baseline. `/storefront` is browsable with no login
at all.

> If seed data ever looks stale or wrong after editing `lib/seed.ts`, run `rm -rf .next` before
> restarting `npm run dev` - Turbopack's build cache can otherwise serve an old compiled version.

## Point it at BoLD

1. In the real BoLD product, create a **Live Monitor** for `http://localhost:3000` (or wherever
   this is deployed).
2. Copy the ingest URL and key it gives you into `.env.local`:
   ```
   BOLD_INGEST_URL=...
   BOLD_INGEST_KEY=...
   SESSION_SECRET=replace-with-a-long-random-demo-secret
   BOLD_OWNER_FIELDS=customerId
   BOLD_SENSITIVE_FIELDS=role,storeCredit
   BOLD_TENANT_FIELDS=storeId
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
3. Restart `npm run dev`.

## Supabase RLS test surface

Meridian includes a server-side Supabase RLS test surface. It is part of the deployed Vercel app,
but it requires your own hosted Supabase project.

1. Create a Supabase project.
2. Run `supabase/migrations/0001_bold_rls_test.sql` in Supabase SQL Editor.
3. Create two Supabase Auth users, user A and user B.
4. Copy their Auth UUIDs.
5. Seed one clean note for user A and one intentionally exposed document for user B:
   ```sql
   insert into notes (owner_id, body)
   values ('USER_A_UUID', 'Private note owned by user A');

   insert into documents (owner_id, body)
   values ('USER_B_UUID', 'Private document owned by user B');

   select * from documents;
   ```
6. Put `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel.
7. Make sure Vercel also has `BOLD_OWNER_FIELDS=customerId,owner_id` so BoLD can read both
   Meridian's existing order owner field and Supabase's RLS owner field.

Supabase test routes:

```txt
POST /api/supabase-auth/login
POST /api/supabase-auth/logout
GET  /api/supabase-notes/self
GET  /api/supabase-documents/{USER_B_DOCUMENT_ID}
```

The clean control is `/api/supabase-notes/self`. The intentional leak is
`/api/supabase-documents/{USER_B_DOCUMENT_ID}` when logged in as user A.

## FastAPI subservice

Meridian also includes a Python FastAPI subservice at `services/fastapi-orders`. This code lives in
the Meridian repo, but it must be deployed separately to Render, Railway, or Fly because Vercel's
Next.js deployment does not run Python ASGI services.

FastAPI seed:

| Order | Owner | Amount |
|---|---|---:|
| `1` | `userA` | `125.50` |
| `2` | `userB` | `249.99` |

FastAPI BOLA trigger after deploying that subservice:

```bash
curl -H "X-User-Id: userA" https://YOUR_FASTAPI_SERVICE_URL/api/orders/2
```

Set these env vars on the Python host:

```env
BOLD_INGEST_URL=...
BOLD_INGEST_KEY=...
BOLD_OWNER_FIELDS=owner_id
```

## Testing plan

Five vulnerability families are seeded into the app, each as a vulnerable/secured route pair so
BoLD's live pipeline can be watched flagging the vulnerable route and correctly clearing the
secured one, off the exact same shape of traffic. For each family below: what the bug is, where
it lives, the exact request that triggers it, and the BoLD signal that confirms detection.

### 1. BOLA - broken object-level authorization

- **Where**: `GET/PUT/DELETE /api/orders/[id]` (vulnerable) vs. `GET /api/orders/[id]/secure`
  (secured).
- **The bug**: the vulnerable route fetches an order by id and returns it without checking that
  `order.customerId` matches the caller's session. Any logged-in customer can read, edit, or
  cancel *any* order in the system just by knowing (or guessing) its id.
- **Attack**: log in as Bob, then request an order that belongs to Alice (`ord_1`):
  ```bash
  curl -s -b bob.cookies http://localhost:3000/api/orders/ord_1
  ```
  Bob gets back Alice's full receipt, address, and payment info.
- **What BoLD should show**: a BOLA finding on `GET /api/orders/[id]` - the response's
  `customerId` field doesn't match the authenticated caller's id (this is what
  `BOLD_OWNER_FIELDS=customerId` tells BoLD to check). The `/secure` counterpart, hit with the
  identical crafted request, should return `403`/`404` and produce no finding.

### 2. BFLA - broken function-level authorization

- **Where**: `GET /api/admin/orders` (vulnerable) vs. `GET /api/admin/orders/secure` (secured).
- **The bug**: this route lists every order across every store and customer - a staff-only,
  platform-wide report - but the vulnerable version never checks `caller.role === "staff"`. Any
  authenticated customer can call it.
- **Attack**: log in as Bob (a plain customer, not staff) and hit the admin listing directly:
  ```bash
  curl -s -b bob.cookies http://localhost:3000/api/admin/orders
  ```
  Bob gets the full order list for both Northwind Traders and Bluebird Goods.
- **What BoLD should show**: a BFLA finding on `GET /api/admin/orders` - a non-privileged caller
  reached a privileged function. The `/secure` counterpart should `403` the same caller and clear.
- **Note**: the sidebar link to Admin Console is intentionally visible to every user, not just
  staff - a real BFLA bug is usually found exactly this way: nothing in the UI hides the door,
  and nothing on the server checks who walks through it.

### 3. BOPLA - broken object property-level authorization (mass assignment)

- **Where**: `PATCH /api/profile` (vulnerable) vs. `PATCH /api/profile/secure` (secured).
- **The bug**: the vulnerable route merges the entire request body into the caller's own user
  record. The Settings page UI only ever sends `{ name }`, but the API itself doesn't restrict
  which fields it accepts - a caller can additionally set `role` or `storeCredit`, fields that
  should never be self-service.
- **Attack**: log in as Bob and PATCH his own profile with extra fields the UI never exposes:
  ```bash
  curl -s -b bob.cookies -X PATCH http://localhost:3000/api/profile \
    -H "Content-Type: application/json" -d '{"role":"staff","storeCredit":500}'
  ```
  Bob is now staff with $500 of store credit, self-granted.
- **What BoLD should show**: a BOPLA finding on `PATCH /api/profile` - the request body writes to
  fields (`role`, `storeCredit`) declared sensitive via `BOLD_SENSITIVE_FIELDS`. The `/secure`
  counterpart whitelists only `name` and silently drops the rest, so the identical payload
  produces no privilege change and no finding.

### 4. Tenant isolation

- **Where**: `GET /api/stores/[storeId]/orders/[id]` (vulnerable) vs. `.../secure` (secured).
- **The bug**: this route is meant to let staff browse their own store's orders. The vulnerable
  version returns the order for *any* `storeId`/`id` pair without checking that the order
  actually belongs to that store - so a Northwind staff member can pull a Bluebird Goods order by
  substituting Bluebird's store id.
- **Attack**: log in as Dana (Northwind staff) and request a Bluebird-only order (`ord_9`,
  Carol's) through Northwind's store path:
  ```bash
  curl -s -b dana.cookies http://localhost:3000/api/stores/store_northwind/orders/ord_9
  ```
  Dana gets Carol's order even though it belongs to a completely different store.
- **What BoLD should show**: a tenant-isolation finding on
  `GET /api/stores/[storeId]/orders/[id]` - the returned order's `storeId` (via
  `BOLD_TENANT_FIELDS=storeId`) doesn't match the `storeId` in the URL/caller's tenant. The
  `/secure` counterpart checks `order.storeId === caller.storeId` and 404s cross-tenant requests.

### 5. Missing authorization (broken authentication)

- **Where**: `GET /api/orders/[id]/receipt` (vulnerable, no auth at all) vs.
  `GET /api/orders/[id]/invoice` (secured, requires a valid session).
- **The bug**: the "receipt" route is reachable with zero credentials - no cookie, no session,
  nothing. It was presumably built for some no-login print/share flow and never had an auth check
  added.
- **Attack**: with no session cookie whatsoever:
  ```bash
  curl -s http://localhost:3000/api/orders/ord_1/receipt
  ```
  Returns Alice's full receipt to a completely anonymous caller.
- **What BoLD should show**: a missing-authorization finding on
  `GET /api/orders/[id]/receipt` - a request with no valid session still received private,
  owner-scoped data. The `/invoice` counterpart requires a session and 401s the same anonymous
  request.

### The false-positive trap

- **Where**: `GET /api/storefront`.
- **What it is**: a genuinely public product catalog - no owner, no session, reachable by anyone,
  by design (this is what a storefront is supposed to be).
- **Why it's here**: to verify BoLD doesn't over-fire. A monitor that flags every unauthenticated
  request as a finding is as useless as one that misses real bugs. Hit this route with no session
  and confirm it is *never* flagged, despite looking superficially similar to the missing-auth bug
  above (no credentials required either way - the difference is that this route returns nobody's
  private data).

## Generate attack traffic

Normal use of the app only ever produces legitimate, same-customer/same-store traffic - by
design, the UI never lets you reach another customer's order (that's what an attacker crafting a
request directly is for). Run this end-to-end script against a live `npm run dev` to trigger every
vulnerable route from the testing plan above, each immediately followed by its secured
counterpart for comparison:

```bash
BASE=http://localhost:3000

# Log in as Bob and keep his session cookie
curl -s -c bob.cookies -X POST $BASE/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$DEMO_EMAIL\",\"password\":\"$DEMO_PASSWORD\"}" >/dev/null

# --- BOLA: Bob reads Alice's private order (ord_1) ---
echo "vulnerable:"; curl -s -b bob.cookies $BASE/api/orders/ord_1
echo "secured:   "; curl -s -b bob.cookies $BASE/api/orders/ord_1/secure

# --- BFLA: Bob (not staff) lists every order in the system ---
echo "vulnerable:"; curl -s -b bob.cookies $BASE/api/admin/orders
echo "secured:   "; curl -s -b bob.cookies $BASE/api/admin/orders/secure

# --- BOPLA: Bob grants himself staff + $500 store credit ---
echo "vulnerable:"; curl -s -b bob.cookies -X PATCH $BASE/api/profile \
  -H "Content-Type: application/json" -d '{"role":"staff","storeCredit":500}'
echo "secured:   "; curl -s -b bob.cookies -X PATCH $BASE/api/profile/secure \
  -H "Content-Type: application/json" -d '{"role":"staff","storeCredit":500}'

# --- Tenant isolation: Bob (Northwind) reads Carol's Bluebird-only order (ord_9) ---
echo "vulnerable:"; curl -s -b bob.cookies $BASE/api/stores/store_northwind/orders/ord_9
echo "secured:   "; curl -s -b bob.cookies $BASE/api/stores/store_northwind/orders/ord_9/secure

# --- Missing authorization: read Alice's order with ZERO credentials ---
echo "vulnerable:"; curl -s $BASE/api/orders/ord_1/receipt
echo "secured:   "; curl -s $BASE/api/orders/ord_1/invoice

# --- The false-positive trap: public by design, should never be flagged ---
curl -s $BASE/api/storefront

rm -f bob.cookies
```

(Restart `npm run dev` afterward, or use a staff demo session and Settings to check the target
account - the BOPLA attack above really does grant store credit and the staff role, since the
in-memory store has no separate "undo," this is a live app.)

## What to check in BoLD afterward

Open the Live Monitor's findings feed and confirm, for each row in the testing plan above: the
vulnerable route surfaces a finding consistent with its family (BOLA / BFLA / BOPLA /
tenant-isolation / missing-auth), the paired secured route does not, and `/api/storefront` is
never flagged despite being reachable by anyone.
