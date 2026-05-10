# Module 1 Supabase Handoff (for Claude)

Use this document as the exact scope for backend alignment with the already-integrated frontend Module 1 (Venue Settings).

---

## Goal

Make sure Supabase has everything needed for **Module 1 only**:

- Venue profile read/update
- Halls list/create/update/delete
- Event types create/update/delete
- Packages list/create/update/delete
- Auth profile RPC used by permissions gate (`get_my_profile`)

The frontend is already wired. We need DB/RLS/RPC parity so there are no soft-fallback warnings.

---

## Frontend contract already in use

### Tables queried directly

- `venues`
  - select: `*` (`maybeSingle`)
  - update by `id`
- `halls`
  - select: `*, event_record_types(*)` ordered by `name`
  - select active halls: `id, name, is_active` where `is_active = true`
  - insert
  - update by `id`
  - delete by `id`
- `event_record_types`
  - insert
  - update by `id`
  - delete by `id`
- `packages`
  - select: `*` ordered by `base_price`
  - insert
  - update by `id`
  - delete by `id`

### RPC queried directly

- `get_my_profile()` (used by `useMyProfile`)

Expected payload shape consumed in frontend:

```json
{
  "id": "uuid",
  "role": "owner|manager|staff|...",
  "email": "user@email.com",
  "status": "active|inactive|...",
  "venues": [],
  "full_name": "string|null",
  "permissions": ["venues.view", "venues.edit", "billing.manage", "..."]
}
```

Minimum permissions required for Module 1 UI behavior:

- `venues.view`
- `venues.edit`
- `billing.manage`

---

## Required schema (Module 1 subset)

### `venues`

- `id uuid pk`
- `name_ar text`
- `name_en text`
- `type venue_type`
- `address text`
- `city city_enum`
- `district text`
- `phone_1 text`
- `phone_2 text`
- `instagram text`
- `facebook text`
- `description_ar text`
- `description_en text`
- `logo_url text`
- `marketplace_active boolean`
- `edit_cutoff_days integer`
- `edit_cutoff_override boolean`
- `created_at timestamptz`

### `halls`

- `id uuid pk`
- `venue_id uuid fk -> venues.id`
- `name text`
- `capacity_min integer`
- `capacity_max integer`
- `amenities text[]`
- `is_active boolean`
- `created_at timestamptz`

### `event_record_types`

- `id uuid pk`
- `hall_id uuid fk -> halls.id`
- `name text`
- `time_model time_model`
- `is_active boolean`

### `packages`

- `id uuid pk`
- `venue_id uuid fk -> venues.id`
- `name text`
- `price_type price_type`
- `base_price numeric`
- `min_guests integer`
- `inclusions text`
- `is_active boolean`
- `created_at timestamptz`

### tenancy relation table used by RLS helper

- `venue_users`
  - `venue_id`
  - `user_id`
  - `role`

---

## RLS requirements

The app assumes tenant isolation by current authenticated user.

Required:

1. `current_venue_id()` helper function
2. RLS enabled on:
   - `venues`
   - `halls`
   - `event_record_types`
   - `packages`
   - `venue_users`
3. Policies:
   - `venues`: user can `select/update` only own venue
   - `halls` + `packages`: `venue_id = current_venue_id()` for read/write
   - `event_record_types`: via hall ownership
   - `venue_users`: at least enough for `current_venue_id()` and profile context

---

## Quick SQL checks (run first)

```sql
-- 1) Missing tables?
select
  to_regclass('public.venues') as venues,
  to_regclass('public.halls') as halls,
  to_regclass('public.event_record_types') as event_record_types,
  to_regclass('public.packages') as packages,
  to_regclass('public.venue_users') as venue_users;

-- 2) Missing RPC?
select
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as args
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('get_my_profile', 'current_venue_id');

-- 3) RLS enabled?
select relname as table_name, relrowsecurity as rls_enabled
from pg_class
where relname in ('venues','halls','event_record_types','packages','venue_users')
order by relname;

-- 4) Policies present?
select schemaname, tablename, policyname, cmd
from pg_policies
where tablename in ('venues','halls','event_record_types','packages','venue_users')
order by tablename, policyname;
```

---

## What to ask Claude to produce

Ask Claude for:

1. **Idempotent SQL migration** (`if not exists`, safe `drop policy if exists` + recreate where needed)
2. Create/fix `get_my_profile()` RPC to return the frontend shape above
3. Ensure RLS policies satisfy module 1 reads/writes
4. Optional seed for one owner user mapped in `venue_users` (dev only)
5. A short post-migration verification script with expected results

---

## Paste this prompt to Claude

```text
You are helping me fix Supabase backend parity for my frontend Module 1 (Venue Settings).

I already integrated frontend queries/mutations for these resources:
- venues: select/update
- halls: select with event_record_types, insert/update/delete
- event_record_types: insert/update/delete
- packages: select/insert/update/delete
- RPC: get_my_profile()

Generate ONE idempotent SQL migration for Postgres/Supabase that:
1) Ensures required tables/columns/enums for those resources exist.
2) Ensures current_venue_id() exists.
3) Enables and fixes RLS policies for venues, halls, event_record_types, packages, venue_users.
4) Creates or replaces get_my_profile() returning:
   { id, role, email, status, venues, full_name, permissions }
   with permissions including at least: venues.view, venues.edit, billing.manage for owner-like roles.
5) Is safe to run in an existing DB (no destructive drops of populated business tables).

Then provide:
- a compact SQL verification block (select checks)
- a short rollback strategy
```

---

## Notes

- Frontend currently handles missing backend gracefully (soft fallback), but we want to eliminate warnings and run fully real data.
- After this is done, we proceed to Module 2 (Dashboard).
