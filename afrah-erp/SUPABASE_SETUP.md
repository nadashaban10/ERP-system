# Supabase Integration Guide — Afrah ERP

Complete step-by-step guide to wire the frontend to a real Supabase backend.

> **Estimated time**: 4-6 hours for full setup (schema + RPCs + RLS + frontend wiring).

---

## Table of Contents

1. [Create Supabase Project](#1-create-supabase-project)
2. [Configure Environment Variables](#2-configure-environment-variables)
3. [Enable Required Extensions](#3-enable-required-extensions)
4. [Create Database Schema](#4-create-database-schema)
5. [Create Indexes](#5-create-indexes)
6. [Create Triggers](#6-create-triggers)
7. [Set Up Row Level Security (RLS)](#7-set-up-row-level-security-rls)
8. [Create RPC Functions](#8-create-rpc-functions)
9. [Set Up Storage](#9-set-up-storage)
10. [Set Up Realtime](#10-set-up-realtime)
11. [Set Up Authentication](#11-set-up-authentication)
12. [Set Up pg_cron Scheduled Jobs](#12-set-up-pg_cron-scheduled-jobs)
13. [Set Up Edge Functions](#13-set-up-edge-functions)
14. [Generate TypeScript Types](#14-generate-typescript-types)
15. [Wire Frontend to Supabase](#15-wire-frontend-to-supabase)
16. [Test Multi-Tenancy (Critical)](#16-test-multi-tenancy-critical)
17. [Pre-Launch Checklist](#17-pre-launch-checklist)

---

## 1. Create Supabase Project

1. Go to [app.supabase.com](https://app.supabase.com) and sign up / sign in.
2. Click **"New Project"**.
3. Fill in:
   - **Project name**: `afrah-erp` (or your venue name)
   - **Database password**: Generate a strong password and save it in 1Password
   - **Region**: `eu-west-1` (Frankfurt) — closest to Egypt with stable latency
   - **Plan**: Start with **Free**, upgrade to **Pro** before launching to real customers
4. Wait ~2 minutes for the project to spin up.
5. Once ready, go to **Settings → API** and copy:
   - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - **anon public key** (starts with `eyJ...`)

---

## 2. Configure Environment Variables

Open `.env.local` in the project root and replace the placeholders:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key

# Optional: only for server-side admin scripts (NEVER expose in client code)
# SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key
```

Restart the dev server after changing env vars: `Ctrl+C` then `npm run dev`.

---

## 3. Enable Required Extensions

In Supabase dashboard → **Database → Extensions**, enable:

- `uuid-ossp` (usually already enabled)
- `pgcrypto` (for `gen_random_uuid()`)
- `pg_cron` (scheduled jobs)
- `pg_net` (HTTP requests from DB, needed by pg_cron → Edge Functions)

---

## 4. Create Database Schema

Open **SQL Editor** in Supabase dashboard, paste this entire script, and run it:

```sql
-- ─── Enums ────────────────────────────────────────────────────────────────────
CREATE TYPE venue_type      AS ENUM ('hall', 'hotel', 'garden', 'boat', 'other');
CREATE TYPE city_enum       AS ENUM ('cairo', 'giza', 'alexandria', 'other');
CREATE TYPE time_model      AS ENUM ('shift_based', 'slot_based');
CREATE TYPE price_type      AS ENUM ('flat_rate', 'per_person');
CREATE TYPE shift_enum      AS ENUM ('morning', 'evening', 'full_day');
CREATE TYPE booking_status  AS ENUM ('inquiry', 'on_hold', 'confirmed', 'completed', 'cancelled');
CREATE TYPE booking_source  AS ENUM ('online', 'phone', 'walk_in', 'agent');
CREATE TYPE cancellation_reason AS ENUM (
  'customer_not_reached', 'chose_another_venue', 'budget_too_high',
  'date_not_available', 'no_longer_getting_married', 'unresponsive_no_contact',
  'hold_expired', 'other'
);
CREATE TYPE inquiry_status  AS ENUM (
  'new', 'contacted', 'pending', 'toured', 'quoted', 'converted', 'cancelled'
);
CREATE TYPE inquiry_source  AS ENUM ('phone', 'walk_in', 'whatsapp', 'instagram', 'other');
CREATE TYPE pending_reason  AS ENUM ('call_again', 'pending_deposit');
CREATE TYPE payment_method  AS ENUM (
  'cash', 'bank_transfer', 'instapay', 'fawry', 'vodafone_cash', 'card', 'adjustment'
);
CREATE TYPE reminder_type   AS ENUM ('scheduled_call', 'deposit_follow_up');
CREATE TYPE reminder_status AS ENUM ('pending', 'fired', 'dismissed', 'completed');
CREATE TYPE reminder_outcome AS ENUM ('converted', 'rescheduled', 'cancelled', 'no_response');
CREATE TYPE notification_type AS ENUM ('reminder_due', 'hold_expiring', 'payment_overdue');
CREATE TYPE user_role       AS ENUM ('owner', 'manager', 'staff');
CREATE TYPE edit_type       AS ENUM (
  'hall', 'date_shift', 'package', 'guest_count', 'notes', 'combined'
);

-- ─── venues ───────────────────────────────────────────────────────────────────
CREATE TABLE venues (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar              text NOT NULL,
  name_en              text NOT NULL,
  type                 venue_type NOT NULL,
  address              text NOT NULL,
  city                 city_enum NOT NULL,
  district             text,
  phone_1              text NOT NULL,
  phone_2              text,
  instagram            text,
  facebook             text,
  description_ar       text,
  description_en       text,
  logo_url             text,
  marketplace_active   boolean NOT NULL DEFAULT false,
  edit_cutoff_days     integer NOT NULL DEFAULT 30,
  edit_cutoff_override boolean NOT NULL DEFAULT false,
  created_at           timestamptz NOT NULL DEFAULT now()
);

-- ─── halls ────────────────────────────────────────────────────────────────────
CREATE TABLE halls (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id     uuid NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  name         text NOT NULL,
  capacity_min integer,
  capacity_max integer NOT NULL,
  amenities    text[] NOT NULL DEFAULT '{}',
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ─── event_record_types ───────────────────────────────────────────────────────
CREATE TABLE event_record_types (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hall_id    uuid NOT NULL REFERENCES halls(id) ON DELETE CASCADE,
  name       text NOT NULL,
  time_model time_model NOT NULL,
  is_active  boolean NOT NULL DEFAULT true
);

-- ─── hall_slots (only for slot_based event types) ─────────────────────────────
CREATE TABLE hall_slots (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hall_id       uuid NOT NULL REFERENCES halls(id) ON DELETE CASCADE,
  event_type_id uuid NOT NULL REFERENCES event_record_types(id) ON DELETE CASCADE,
  name          text NOT NULL,
  start_time    time NOT NULL,
  end_time      time NOT NULL,
  is_active     boolean NOT NULL DEFAULT true
);

-- ─── packages ─────────────────────────────────────────────────────────────────
CREATE TABLE packages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id    uuid NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  name        text NOT NULL,
  price_type  price_type NOT NULL,
  base_price  numeric(10, 2) NOT NULL,
  min_guests  integer,
  inclusions  text,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ─── clients ──────────────────────────────────────────────────────────────────
CREATE TABLE clients (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id   uuid NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  name       text NOT NULL,
  phone_1    text NOT NULL,
  phone_2    text,
  email      text,
  notes      text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ─── bookings ─────────────────────────────────────────────────────────────────
CREATE TABLE bookings (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id            uuid NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  hall_id             uuid NOT NULL REFERENCES halls(id),
  event_type_id       uuid NOT NULL REFERENCES event_record_types(id),
  package_id          uuid REFERENCES packages(id),
  client_id           uuid NOT NULL REFERENCES clients(id),
  event_date          date NOT NULL,
  shift               shift_enum,
  slot_id             uuid REFERENCES hall_slots(id),
  start_time          time NOT NULL,
  end_time            time NOT NULL,
  status              booking_status NOT NULL,
  source              booking_source NOT NULL,
  total_amount        numeric(10, 2),
  amount_paid         numeric(10, 2) NOT NULL DEFAULT 0,
  amount_outstanding  numeric(10, 2) NOT NULL DEFAULT 0,
  guest_count         integer,
  assigned_to         text,
  notes               text,
  hold_expires_at     timestamptz,
  cancellation_reason cancellation_reason,
  last_edited_at      timestamptz,
  last_edited_by      uuid REFERENCES auth.users(id),
  edit_count          integer NOT NULL DEFAULT 0,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),

  -- Exactly one of shift / slot_id must be set
  CONSTRAINT shift_xor_slot CHECK (
    (shift IS NULL) != (slot_id IS NULL)
  ),
  -- on_hold requires hold_expires_at
  CONSTRAINT hold_requires_expiry CHECK (
    status != 'on_hold' OR hold_expires_at IS NOT NULL
  ),
  -- cancelled requires cancellation_reason
  CONSTRAINT cancelled_requires_reason CHECK (
    status != 'cancelled' OR cancellation_reason IS NOT NULL
  )
);

-- ─── payments ─────────────────────────────────────────────────────────────────
CREATE TABLE payments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  venue_id   uuid NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  amount     numeric(10, 2) NOT NULL,
  method     payment_method NOT NULL,
  paid_at    date NOT NULL,
  milestone  text,
  proof_url  text,
  logged_by  uuid NOT NULL REFERENCES auth.users(id),
  notes      text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ─── inquiries ────────────────────────────────────────────────────────────────
CREATE TABLE inquiries (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id            uuid NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  client_id           uuid NOT NULL REFERENCES clients(id),
  desired_date        date,
  alt_date            date,
  guest_count         integer,
  package_interest    text,
  source              inquiry_source NOT NULL,
  status              inquiry_status NOT NULL DEFAULT 'new',
  pending_reason      pending_reason,
  pending_notes       text,
  cancellation_reason cancellation_reason,
  no_response_count   integer NOT NULL DEFAULT 0,
  last_attempt_at     timestamptz,
  booking_id          uuid REFERENCES bookings(id),
  follow_up_date      date,
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT pending_requires_reason CHECK (
    status != 'pending' OR pending_reason IS NOT NULL
  ),
  CONSTRAINT cancelled_requires_reason CHECK (
    status != 'cancelled' OR cancellation_reason IS NOT NULL
  ),
  CONSTRAINT no_response_max_3 CHECK (no_response_count <= 3)
);

-- ─── inquiry_reminders ────────────────────────────────────────────────────────
CREATE TABLE inquiry_reminders (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id     uuid NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
  venue_id       uuid NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  assigned_to    uuid NOT NULL REFERENCES auth.users(id),
  reminder_type  reminder_type NOT NULL,
  scheduled_at   timestamptz NOT NULL,
  status         reminder_status NOT NULL DEFAULT 'pending',
  outcome        reminder_outcome,
  outcome_notes  text,
  fired_at       timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ─── notifications ────────────────────────────────────────────────────────────
CREATE TABLE notifications (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES auth.users(id),
  venue_id       uuid NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  type           notification_type NOT NULL,
  title          text NOT NULL,
  body           text NOT NULL,
  reference_id   uuid,
  reference_type text CHECK (reference_type IN ('inquiry', 'booking')),
  is_read        boolean NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ─── booking_edit_history ─────────────────────────────────────────────────────
CREATE TABLE booking_edit_history (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id           uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  venue_id             uuid NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  edited_by            uuid NOT NULL REFERENCES auth.users(id),
  edit_type            edit_type NOT NULL,
  previous_values      jsonb NOT NULL,
  new_values           jsonb NOT NULL,
  financial_adjustment jsonb,
  agent_notes          text,
  created_at           timestamptz NOT NULL DEFAULT now()
);

-- ─── venue_users ──────────────────────────────────────────────────────────────
CREATE TABLE venue_users (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id   uuid NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id),
  role       user_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (venue_id, user_id)
);
```

---

## 5. Create Indexes

Critical for performance — run these in SQL Editor:

```sql
-- Multi-tenant query performance
CREATE INDEX idx_halls_venue              ON halls(venue_id);
CREATE INDEX idx_packages_venue           ON packages(venue_id);
CREATE INDEX idx_clients_venue            ON clients(venue_id);
CREATE INDEX idx_bookings_venue           ON bookings(venue_id);
CREATE INDEX idx_inquiries_venue          ON inquiries(venue_id);
CREATE INDEX idx_payments_venue           ON payments(venue_id);
CREATE INDEX idx_notifications_venue_user ON notifications(venue_id, user_id);

-- Calendar lookup
CREATE INDEX idx_bookings_date_hall       ON bookings(venue_id, hall_id, event_date);
CREATE INDEX idx_bookings_status_date     ON bookings(venue_id, status, event_date);

-- Double-booking prevention (unique partial index)
CREATE UNIQUE INDEX idx_bookings_unique_shift
  ON bookings(hall_id, event_date, shift)
  WHERE shift IS NOT NULL AND status != 'cancelled';

-- Slot-based booking lookup
CREATE INDEX idx_bookings_slot
  ON bookings(hall_id, event_date, slot_id)
  WHERE slot_id IS NOT NULL;

-- Inquiry follow-ups
CREATE INDEX idx_inquiries_follow_up
  ON inquiries(venue_id, follow_up_date)
  WHERE status NOT IN ('cancelled', 'converted');

CREATE INDEX idx_inquiries_status
  ON inquiries(venue_id, status);

-- Reminder scheduler
CREATE INDEX idx_reminders_scheduled
  ON inquiry_reminders(scheduled_at, status)
  WHERE status = 'pending';

-- Hold expiry scheduler
CREATE INDEX idx_bookings_hold_expiring
  ON bookings(hold_expires_at, status)
  WHERE status = 'on_hold';

-- Notifications
CREATE INDEX idx_notifications_user_unread
  ON notifications(user_id, created_at DESC)
  WHERE is_read = false;

-- Phone lookup (used by booking wizard)
CREATE INDEX idx_clients_phone ON clients(venue_id, phone_1);

-- Edit history
CREATE INDEX idx_edit_history_booking ON booking_edit_history(booking_id, created_at DESC);

-- Reminder timeline per inquiry
CREATE INDEX idx_reminders_inquiry ON inquiry_reminders(inquiry_id, created_at DESC);

-- Payments per booking
CREATE INDEX idx_payments_booking ON payments(booking_id, paid_at DESC);
```

---

## 6. Create Triggers

These keep derived data in sync automatically.

```sql
-- ─── Auto-update updated_at on bookings & inquiries ──────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_inquiries_updated_at
  BEFORE UPDATE ON inquiries
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Auto-recalculate booking financials on payment insert/delete ────────────
CREATE OR REPLACE FUNCTION recalc_booking_payments() RETURNS trigger AS $$
DECLARE
  bid uuid := COALESCE(NEW.booking_id, OLD.booking_id);
  total_paid numeric;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO total_paid
    FROM payments WHERE booking_id = bid;

  UPDATE bookings
    SET amount_paid = total_paid,
        amount_outstanding = COALESCE(total_amount, 0) - total_paid
    WHERE id = bid;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_payments_recalc
  AFTER INSERT OR DELETE ON payments
  FOR EACH ROW EXECUTE FUNCTION recalc_booking_payments();

-- ─── Reminder fired → in-app notification (bell reads `notifications` table) ───
-- When a cron/Edge job sets `inquiry_reminders.status` from `pending` to `fired`,
-- this creates one row per assignee. Pair with §12 Edge Function or pg_cron that
-- only UPDATES reminders to `fired` — do not also INSERT notifications there (see §13 Edge Functions).
CREATE OR REPLACE FUNCTION notify_reminder_due()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_inquiry inquiries%ROWTYPE;
  v_client  clients%ROWTYPE;
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.status = 'fired'
     AND OLD.status = 'pending'
  THEN
    SELECT * INTO v_inquiry FROM inquiries WHERE id = NEW.inquiry_id;
    SELECT * INTO v_client FROM clients WHERE id = v_inquiry.client_id;

    INSERT INTO notifications (
      user_id, venue_id, type, title, body, reference_id, reference_type
    ) VALUES (
      NEW.assigned_to,
      NEW.venue_id,
      'reminder_due',
      CASE NEW.reminder_type
        WHEN 'scheduled_call' THEN 'Follow-up call due'
        WHEN 'deposit_follow_up' THEN 'Pending deposit follow-up'
        ELSE 'Reminder due'
      END,
      'Client: ' || COALESCE(v_client.name, '') || ' · ' || COALESCE(v_client.phone_1, ''),
      NEW.inquiry_id,
      'inquiry'
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_inquiry_reminders_notify
  AFTER UPDATE OF status ON inquiry_reminders
  FOR EACH ROW
  EXECUTE FUNCTION notify_reminder_due();
```

---

## 7. Set Up Row Level Security (RLS)

**Critical**: this enforces multi-tenancy. Every venue can only see its own data.

```sql
-- Helper function: get current user's venue_id
CREATE OR REPLACE FUNCTION current_venue_id() RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT venue_id FROM venue_users WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Enable RLS on every table
ALTER TABLE venues               ENABLE ROW LEVEL SECURITY;
ALTER TABLE halls                ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_record_types   ENABLE ROW LEVEL SECURITY;
ALTER TABLE hall_slots           ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages             ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients              ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings             ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments             ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries            ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiry_reminders    ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications        ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_edit_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_users          ENABLE ROW LEVEL SECURITY;

-- Generic policies — venue isolation
CREATE POLICY venues_select ON venues
  FOR SELECT USING (id = current_venue_id());
CREATE POLICY venues_update ON venues
  FOR UPDATE USING (id = current_venue_id());

-- Apply same pattern to all venue-scoped tables
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'halls','event_record_types','hall_slots','packages','clients',
    'bookings','payments','inquiries','inquiry_reminders',
    'notifications','booking_edit_history'
  ] LOOP
    EXECUTE format(
      'CREATE POLICY %I_all ON %I
         FOR ALL USING (venue_id = current_venue_id())
         WITH CHECK (venue_id = current_venue_id())',
      t || '_isolation', t
    );
  END LOOP;
END$$;

-- Special case: event_record_types and hall_slots inherit through halls
-- (they reference hall_id, not venue_id directly)
CREATE POLICY event_types_isolation ON event_record_types
  FOR ALL USING (
    EXISTS (SELECT 1 FROM halls h WHERE h.id = hall_id AND h.venue_id = current_venue_id())
  );
CREATE POLICY hall_slots_isolation ON hall_slots
  FOR ALL USING (
    EXISTS (SELECT 1 FROM halls h WHERE h.id = hall_id AND h.venue_id = current_venue_id())
  );

-- venue_users: users can only see their own venue's user list
CREATE POLICY venue_users_select ON venue_users
  FOR SELECT USING (venue_id = current_venue_id());

-- Notifications: users only see their own
DROP POLICY IF EXISTS notifications_isolation ON notifications;
CREATE POLICY notifications_select ON notifications
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY notifications_update ON notifications
  FOR UPDATE USING (user_id = auth.uid());
```

---

## 8. Create RPC Functions

These are the atomic operations the frontend calls. All are `SECURITY DEFINER` and validate venue access.

### 8.1 `get_venue_for_user`

```sql
CREATE OR REPLACE FUNCTION get_venue_for_user()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_venue_id uuid;
  result jsonb;
BEGIN
  SELECT venue_id INTO v_venue_id FROM venue_users WHERE user_id = auth.uid() LIMIT 1;
  IF v_venue_id IS NULL THEN
    RAISE EXCEPTION 'User has no venue assigned';
  END IF;

  SELECT jsonb_build_object(
    'venue_id', v.id,
    'venue_name', v.name_en,
    'settings', row_to_json(v),
    'halls', COALESCE((SELECT jsonb_agg(row_to_json(h)) FROM halls h WHERE h.venue_id = v.id), '[]')
  ) INTO result
  FROM venues v WHERE v.id = v_venue_id;

  RETURN result;
END;
$$;
```

### 8.2 `check_availability` (shift-based)

PostgREST sends JSON keys that **must match** the SQL parameter names exactly. The app uses **`p_event_date`** and **`p_exclude_booking`** (see `runCheckAvailabilityRpc`).

```sql
CREATE OR REPLACE FUNCTION check_availability(
  p_hall_id uuid,
  p_event_date date,
  p_shift shift_enum,
  p_exclude_booking uuid DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_existing bookings%ROWTYPE;
BEGIN
  SELECT * INTO v_existing
  FROM bookings
  WHERE hall_id = p_hall_id
    AND event_date = p_event_date
    AND status != 'cancelled'
    AND (p_exclude_booking IS NULL OR id != p_exclude_booking)
    AND (
      shift = p_shift
      OR shift = 'full_day'
      OR (p_shift = 'full_day' AND shift IN ('morning', 'evening'))
    )
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('available', true);
  END IF;

  RETURN jsonb_build_object(
    'available', false,
    'status', v_existing.status,
    'booking_id', v_existing.id
  );
END;
$$;
```

Optional UX: join `clients` and add `'client_name', c.name` to the conflict payload if you want the wizard to show who holds the slot (the UI uses `client_name` when present).

### 8.3 `check_slot_overlap` (slot-based)

```sql
CREATE OR REPLACE FUNCTION check_slot_overlap(
  p_hall_id uuid,
  p_date date,
  p_start_time time,
  p_end_time time,
  p_exclude_booking_id uuid DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM bookings
    WHERE hall_id = p_hall_id
      AND event_date = p_date
      AND status != 'cancelled'
      AND id != COALESCE(p_exclude_booking_id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND (start_time, end_time) OVERLAPS (p_start_time, p_end_time)
  ) THEN
    RETURN jsonb_build_object('available', false);
  END IF;
  RETURN jsonb_build_object('available', true);
END;
$$;
```

### 8.4 `create_booking`

PostgREST passes the JSON payload as **`p_data`** — the app calls:

`supabase.rpc("create_booking", { p_data: { ... } })`.

Expected JSON keys align with `buildCreateBookingJson` in `src/lib/queries/bookings.ts` (including **`client_phone_2`** for `clients.phone_2`, plus legacy **`client_phone2`**).

Use **`get_user_venue_id()`** here only if that helper exists in your DB; otherwise substitute **`current_venue_id()`** (or your project’s equivalent).

```sql
CREATE OR REPLACE FUNCTION create_booking(p_data jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_venue_id    UUID := get_user_venue_id();
  v_client_id   UUID;
  v_booking_id  UUID;
  v_avail       JSONB;
BEGIN
  -- Create client inline if phone provided and not found
  IF (p_data->>'client_id') IS NULL OR (p_data->>'client_id') = '' THEN
    INSERT INTO clients (venue_id, name, phone_1, phone_2, email, notes)
    VALUES (
      v_venue_id,
      p_data->>'client_name',
      p_data->>'client_phone',
      COALESCE(
        NULLIF(TRIM(p_data->>'client_phone_2'), ''),
        NULLIF(TRIM(p_data->>'client_phone2'), '')
      ),
      NULLIF(TRIM(p_data->>'client_email'), ''),
      NULLIF(TRIM(p_data->>'client_notes'), '')
    )
    RETURNING id INTO v_client_id;
  ELSE
    v_client_id := (p_data->>'client_id')::UUID;
  END IF;

  -- Availability check (shift-based)
  IF (p_data->>'shift') IS NOT NULL AND TRIM(p_data->>'shift') <> '' THEN
    v_avail := check_availability(
      (p_data->>'hall_id')::UUID,
      (p_data->>'event_date')::DATE,
      (p_data->>'shift')::shift_enum
    );
    IF NOT COALESCE((v_avail->>'available')::BOOLEAN, FALSE) THEN
      RETURN jsonb_build_object('error', 'slot_unavailable', 'detail', v_avail);
    END IF;
  END IF;

  -- Availability check (slot-based)
  IF (p_data->>'slot_id') IS NOT NULL AND TRIM(p_data->>'slot_id') <> '' THEN
    DECLARE
      v_slot hall_slots%ROWTYPE;
    BEGIN
      SELECT * INTO v_slot FROM hall_slots WHERE id = (p_data->>'slot_id')::UUID;
      v_avail := check_slot_overlap(
        (p_data->>'hall_id')::UUID,
        (p_data->>'event_date')::DATE,
        v_slot.start_time,
        v_slot.end_time,
        NULL
      );
      IF NOT COALESCE((v_avail->>'available')::BOOLEAN, FALSE) THEN
        RETURN jsonb_build_object('error', 'slot_unavailable', 'detail', v_avail);
      END IF;
    END;
  END IF;

  INSERT INTO bookings (
    venue_id, hall_id, event_type_id, package_id, client_id,
    event_date, shift, slot_id, start_time, end_time,
    status, source, total_amount, guest_count, assigned_to, notes,
    hold_expires_at
  ) VALUES (
    v_venue_id,
    (p_data->>'hall_id')::UUID,
    (p_data->>'event_type_id')::UUID,
    NULLIF(TRIM(p_data->>'package_id'), '')::UUID,
    v_client_id,
    (p_data->>'event_date')::DATE,
    NULLIF(TRIM(p_data->>'shift'), '')::shift_enum,
    NULLIF(TRIM(p_data->>'slot_id'), '')::UUID,
    COALESCE((p_data->>'start_time')::TIME, '00:00'),
    COALESCE((p_data->>'end_time')::TIME, '00:01'),
    COALESCE(NULLIF(TRIM(p_data->>'status'), '')::booking_status, 'confirmed'),
    (p_data->>'source')::booking_source,
    NULLIF(TRIM(p_data->>'total_amount'), '')::DECIMAL,
    NULLIF(TRIM(p_data->>'guest_count'), '')::INTEGER,
    NULLIF(TRIM(p_data->>'assigned_to'), ''),
    NULLIF(TRIM(p_data->>'notes'), ''),
    NULLIF(TRIM(p_data->>'hold_expires_at'), '')::TIMESTAMPTZ
  )
  RETURNING id INTO v_booking_id;

  RETURN jsonb_build_object('booking_id', v_booking_id, 'client_id', v_client_id);
END;
$$;
```

**Note:** If your project renamed enums (e.g. `booking_status_enum`), adjust the casts. If `check_slot_overlap` differs from §8.3, align the call signature.

### 8.5 `cancel_booking`

```sql
CREATE OR REPLACE FUNCTION cancel_booking(
  p_booking_id uuid,
  p_reason cancellation_reason,
  p_notes text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_outstanding numeric;
BEGIN
  SELECT amount_outstanding INTO v_outstanding
    FROM bookings WHERE id = p_booking_id AND venue_id = current_venue_id();

  UPDATE bookings
    SET status = 'cancelled',
        cancellation_reason = p_reason,
        notes = COALESCE(notes || E'\n', '') || COALESCE(p_notes, '')
    WHERE id = p_booking_id AND venue_id = current_venue_id();

  RETURN jsonb_build_object(
    'success', true,
    'outstanding_egp', v_outstanding
  );
END;
$$;
```

### 8.6 `is_edit_allowed`

```sql
CREATE OR REPLACE FUNCTION is_edit_allowed(
  p_booking_id uuid,
  p_override boolean DEFAULT false
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_event_date date;
  v_cutoff integer;
  v_days_remaining integer;
BEGIN
  SELECT b.event_date, v.edit_cutoff_days
    INTO v_event_date, v_cutoff
    FROM bookings b
    JOIN venues v ON v.id = b.venue_id
    WHERE b.id = p_booking_id AND b.venue_id = current_venue_id();

  v_days_remaining := v_event_date - CURRENT_DATE;

  IF v_event_date < CURRENT_DATE THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'event_passed', 'days_remaining', v_days_remaining);
  END IF;

  IF v_days_remaining < v_cutoff AND NOT p_override THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'within_cutoff', 'days_remaining', v_days_remaining);
  END IF;

  RETURN jsonb_build_object('allowed', true, 'days_remaining', v_days_remaining);
END;
$$;
```

### 8.7 `edit_booking`

```sql
CREATE OR REPLACE FUNCTION edit_booking(
  p_booking_id uuid,
  p_changes jsonb,
  p_financial_resolution jsonb DEFAULT NULL,
  p_agent_notes text DEFAULT NULL,
  p_override_cutoff boolean DEFAULT false
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_venue uuid := current_venue_id();
  v_old bookings%ROWTYPE;
  v_edit_type edit_type;
  v_check jsonb;
BEGIN
  -- Verify edit allowed
  v_check := is_edit_allowed(p_booking_id, p_override_cutoff);
  IF NOT (v_check->>'allowed')::boolean THEN
    RAISE EXCEPTION 'Edit not allowed: %', v_check->>'reason';
  END IF;

  SELECT * INTO v_old FROM bookings WHERE id = p_booking_id AND venue_id = v_venue;

  -- Determine edit type
  v_edit_type := CASE
    WHEN p_changes ? 'package_id' THEN 'package'::edit_type
    WHEN p_changes ? 'hall_id' THEN 'hall'::edit_type
    WHEN p_changes ? 'event_date' OR p_changes ? 'shift' THEN 'date_shift'::edit_type
    WHEN p_changes ? 'guest_count' THEN 'guest_count'::edit_type
    WHEN p_changes ? 'notes' THEN 'notes'::edit_type
    ELSE 'combined'::edit_type
  END;

  -- Apply changes (only fields present in p_changes)
  UPDATE bookings SET
    hall_id       = COALESCE((p_changes->>'hall_id')::uuid, hall_id),
    package_id    = COALESCE(NULLIF(p_changes->>'package_id', '')::uuid, package_id),
    event_date    = COALESCE((p_changes->>'event_date')::date, event_date),
    shift         = COALESCE((p_changes->>'shift')::shift_enum, shift),
    total_amount  = COALESCE((p_changes->>'total_amount')::numeric, total_amount),
    guest_count   = COALESCE((p_changes->>'guest_count')::integer, guest_count),
    assigned_to   = COALESCE(p_changes->>'assigned_to', assigned_to),
    notes         = COALESCE(p_changes->>'notes', notes),
    last_edited_at = now(),
    last_edited_by = auth.uid(),
    edit_count    = edit_count + 1
  WHERE id = p_booking_id;

  -- Record history
  INSERT INTO booking_edit_history (
    booking_id, venue_id, edited_by, edit_type,
    previous_values, new_values, financial_adjustment, agent_notes
  ) VALUES (
    p_booking_id, v_venue, auth.uid(), v_edit_type,
    to_jsonb(v_old), p_changes, p_financial_resolution, p_agent_notes
  );

  RETURN jsonb_build_object('success', true, 'edit_count', v_old.edit_count + 1);
END;
$$;
```

### 8.8 `convert_inquiry_to_booking`

Runs **`create_booking`** first; if that JSON payload contains **`error`**, returns it **before** reading **`booking_id`**. Then links the inquiry and completes open reminders.

PostgREST + JS use **`p_booking_data`** for the booking JSON.

```sql
CREATE OR REPLACE FUNCTION convert_inquiry_to_booking(
  p_inquiry_id uuid,
  p_booking_data jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_result     JSONB;
  v_booking_id UUID;
BEGIN
  v_result := create_booking(p_booking_data);

  IF v_result ? 'error' THEN
    RETURN v_result;
  END IF;

  v_booking_id := (v_result->>'booking_id')::UUID;

  UPDATE inquiries
  SET status = 'converted', booking_id = v_booking_id, updated_at = NOW()
  WHERE id = p_inquiry_id;

  UPDATE inquiry_reminders
  SET status = 'completed', outcome = 'converted'::reminder_outcome
  WHERE inquiry_id = p_inquiry_id AND status IN ('pending', 'fired');

  RETURN jsonb_build_object('booking_id', v_booking_id);
END;
$$;
```

Adjust **`reminder_outcome`** cast if your enum type name differs (e.g. plain `reminder_outcome` without schema). Add **`AND venue_id = current_venue_id()`** on `UPDATE inquiries` if you rely on that helper elsewhere.

### 8.9 `set_inquiry_pending`

PostgREST JSON keys must match parameter names: **`p_reason`**, **`p_notes`** (not `p_pending_*`).  
`p_reminder_data` should include **`reminder_type`**, **`scheduled_at`** (ISO timestamps); optional **`assigned_to`** (UUID string) defaults to **`auth.uid()`**.

```sql
CREATE OR REPLACE FUNCTION set_inquiry_pending(
  p_inquiry_id uuid,
  p_reason pending_reason,
  p_notes text,
  p_reminder_data jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_reminder_id UUID;
BEGIN
  UPDATE inquiries
  SET status = 'pending',
      pending_reason = p_reason,
      pending_notes = p_notes,
      updated_at = NOW()
  WHERE id = p_inquiry_id;

  INSERT INTO inquiry_reminders (
    inquiry_id, venue_id, assigned_to, reminder_type, scheduled_at, status
  ) VALUES (
    p_inquiry_id,
    (SELECT venue_id FROM inquiries WHERE id = p_inquiry_id),
    COALESCE((p_reminder_data->>'assigned_to')::UUID, auth.uid()),
    (p_reminder_data->>'reminder_type')::reminder_type,
    (p_reminder_data->>'scheduled_at')::TIMESTAMPTZ,
    'pending'
  )
  RETURNING id INTO v_reminder_id;

  RETURN jsonb_build_object('reminder_id', v_reminder_id);
END;
$$;
```

If your enum is named **`reminder_type_enum`**, change the cast accordingly.

### 8.10 `log_no_response`

```sql
CREATE OR REPLACE FUNCTION log_no_response(
  p_reminder_id uuid,
  p_notes text DEFAULT NULL,
  p_next_call_at timestamptz DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_inquiry_id uuid;
  v_count integer;
  v_new_id uuid;
BEGIN
  SELECT inquiry_id INTO v_inquiry_id
    FROM inquiry_reminders WHERE id = p_reminder_id;

  -- Increment no_response_count
  UPDATE inquiries
    SET no_response_count = no_response_count + 1,
        last_attempt_at = now()
    WHERE id = v_inquiry_id
    RETURNING no_response_count INTO v_count;

  -- Mark current reminder completed
  UPDATE inquiry_reminders
    SET status = 'completed', outcome = 'no_response', outcome_notes = p_notes
    WHERE id = p_reminder_id;

  -- 3rd attempt = auto-close
  IF v_count >= 3 THEN
    UPDATE inquiries
      SET status = 'cancelled', cancellation_reason = 'customer_not_reached'
      WHERE id = v_inquiry_id;
    RETURN jsonb_build_object('action', 'auto_closed', 'attempt', v_count);
  END IF;

  -- Otherwise create next reminder
  INSERT INTO inquiry_reminders (
    inquiry_id, venue_id, assigned_to, reminder_type, scheduled_at, status
  )
  SELECT v_inquiry_id, venue_id, auth.uid(), 'scheduled_call',
         COALESCE(p_next_call_at, now() + interval '1 day'), 'pending'
    FROM inquiries WHERE id = v_inquiry_id
    RETURNING id INTO v_new_id;

  RETURN jsonb_build_object('action', 'rescheduled', 'attempt', v_count, 'next_reminder_id', v_new_id);
END;
$$;
```

### 8.11 `resolve_reminder`

```sql
CREATE OR REPLACE FUNCTION resolve_reminder(
  p_reminder_id uuid,
  p_outcome reminder_outcome,
  p_outcome_notes text,
  p_next_call_at timestamptz DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_inquiry_id uuid;
  v_new_id uuid;
BEGIN
  SELECT inquiry_id INTO v_inquiry_id
    FROM inquiry_reminders WHERE id = p_reminder_id;

  UPDATE inquiry_reminders
    SET status = 'completed', outcome = p_outcome, outcome_notes = p_outcome_notes
    WHERE id = p_reminder_id;

  IF p_outcome = 'rescheduled' AND p_next_call_at IS NOT NULL THEN
    INSERT INTO inquiry_reminders (
      inquiry_id, venue_id, assigned_to, reminder_type, scheduled_at, status
    )
    SELECT v_inquiry_id, venue_id, auth.uid(), 'scheduled_call', p_next_call_at, 'pending'
      FROM inquiries WHERE id = v_inquiry_id
      RETURNING id INTO v_new_id;
  END IF;

  IF p_outcome = 'cancelled' THEN
    UPDATE inquiries SET status = 'cancelled', cancellation_reason = 'other'
      WHERE id = v_inquiry_id;
  END IF;

  RETURN jsonb_build_object('action', p_outcome::text, 'next_reminder_id', v_new_id);
END;
$$;
```

### 8.12 `log_payment`

```sql
CREATE OR REPLACE FUNCTION log_payment(
  p_booking_id uuid,
  p_amount numeric,
  p_method payment_method,
  p_paid_at date,
  p_milestone text DEFAULT NULL,
  p_proof_url text DEFAULT NULL,
  p_notes text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_payment_id uuid;
BEGIN
  INSERT INTO payments (
    booking_id, venue_id, amount, method, paid_at, milestone, proof_url, logged_by, notes
  )
  SELECT p_booking_id, venue_id, p_amount, p_method, p_paid_at, p_milestone, p_proof_url, auth.uid(), p_notes
    FROM bookings WHERE id = p_booking_id AND venue_id = current_venue_id()
    RETURNING id INTO v_payment_id;

  RETURN jsonb_build_object('payment_id', v_payment_id);
END;
$$;
```

### 8.13 `get_dashboard_summary`

```sql
CREATE OR REPLACE FUNCTION get_dashboard_summary(p_hall_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_venue uuid := current_venue_id();
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'today_bookings', COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
        'id', b.id, 'client_name', c.name, 'hall_name', h.name,
        'start_time', b.start_time, 'status', b.status
      ))
        FROM bookings b
        JOIN clients c ON c.id = b.client_id
        JOIN halls h ON h.id = b.hall_id
        WHERE b.venue_id = v_venue
          AND b.event_date = CURRENT_DATE
          AND b.status != 'cancelled'
          AND (p_hall_id IS NULL OR b.hall_id = p_hall_id)
      ), '[]'),

    'week_count', (SELECT count(*) FROM bookings
       WHERE venue_id = v_venue
         AND event_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 7
         AND status != 'cancelled'
         AND (p_hall_id IS NULL OR hall_id = p_hall_id)),

    'outstanding_egp', (SELECT COALESCE(SUM(amount_outstanding), 0) FROM bookings
       WHERE venue_id = v_venue
         AND status NOT IN ('cancelled', 'completed')
         AND (p_hall_id IS NULL OR hall_id = p_hall_id)),

    'overdue_followups_count', (SELECT count(*) FROM inquiries
       WHERE venue_id = v_venue
         AND follow_up_date <= CURRENT_DATE
         AND status NOT IN ('cancelled', 'converted')),

    'expiring_holds', COALESCE(
      (SELECT jsonb_agg(jsonb_build_object('id', b.id, 'client_name', c.name, 'hold_expires_at', b.hold_expires_at))
        FROM bookings b
        JOIN clients c ON c.id = b.client_id
        WHERE b.venue_id = v_venue
          AND b.status = 'on_hold'
          AND b.hold_expires_at BETWEEN now() AND now() + interval '7 days'
      ), '[]')
  ) INTO result;

  RETURN result;
END;
$$;
```

---

## 9. Set Up Storage

For payment proof screenshots and venue logos.

In Supabase dashboard → **Storage**:

1. Create a bucket named `payment-proofs` (private).
2. Create a bucket named `venue-logos` (public).
3. Add storage policies:

```sql
-- Payment proofs: only authenticated users from the same venue can access
CREATE POLICY payment_proofs_access ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'payment-proofs' AND (storage.foldername(name))[1] = current_venue_id()::text);

-- Venue logos: public read, authenticated upload
CREATE POLICY venue_logos_select ON storage.objects
  FOR SELECT USING (bucket_id = 'venue-logos');

CREATE POLICY venue_logos_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'venue-logos' AND (storage.foldername(name))[1] = current_venue_id()::text);
```

**Convention**: store files at `{venue_id}/{filename}`.

---

## 10. Set Up Realtime

In Supabase dashboard → **Database → Replication**:

1. Find the `notifications` table.
2. Toggle **Realtime** on (required for live bell updates: the app subscribes via `useSubscribeToNotifications` and refetches when rows insert/update).
3. (Optional) Also enable for `bookings` if you want live calendar updates across devices.

---

## 11. Set Up Authentication

In Supabase dashboard → **Authentication**:

1. **Providers**: Enable Email/Password (already on by default).
2. **Email templates**: Translate to Arabic if needed.
3. **URL Configuration**:
   - Site URL: `https://yourdomain.com` (or `http://localhost:3000` for dev)
   - Redirect URLs: add `http://localhost:3000/**` for dev

### Create your first venue & user

Run this in SQL Editor (replace email/UUID):

```sql
-- Step 1: Create a venue
INSERT INTO venues (name_ar, name_en, type, address, city, phone_1)
  VALUES ('قاعة الأفراح الكبرى', 'Grand Afrah Hall', 'hall', 'Cairo, Egypt', 'cairo', '01001234567')
  RETURNING id;
-- Copy the returned UUID

-- Step 2: Create user via Auth → Users → Add user (in Supabase dashboard)
-- Or invite via email

-- Step 3: Link user to venue
INSERT INTO venue_users (venue_id, user_id, role)
  VALUES ('<venue-uuid>', '<user-uuid>', 'owner');
```

---

## 12. Set Up pg_cron Scheduled Jobs

```sql
-- Run hold expiry check every hour
SELECT cron.schedule(
  'expire-holds',
  '0 * * * *',
  $$
    UPDATE bookings
      SET status = 'cancelled',
          cancellation_reason = 'hold_expired'
      WHERE status = 'on_hold' AND hold_expires_at <= now();
  $$
);

-- Fire reminders every 5 minutes (calls Edge Function)
-- This requires pg_net extension, see section 13 for the Edge Function code
SELECT cron.schedule(
  'fire-reminders',
  '*/5 * * * *',
  $$
    SELECT net.http_post(
      url := 'https://YOUR-PROJECT.supabase.co/functions/v1/fire-reminders',
      headers := jsonb_build_object(
        'Authorization', 'Bearer YOUR-SERVICE-ROLE-KEY',
        'Content-Type', 'application/json'
      )
    );
  $$
);
```

---

## 13. Set Up Edge Functions

Install Supabase CLI: `npm install -g supabase`.

```bash
supabase login
supabase link --project-ref your-project-ref
supabase functions new fire-reminders
```

Edit `supabase/functions/fire-reminders/index.ts`:

```typescript
import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Find pending reminders that are due
  const { data: due } = await supabase
    .from("inquiry_reminders")
    .select("*, inquiries(client_id, clients(name))")
    .eq("status", "pending")
    .lte("scheduled_at", new Date().toISOString());

  if (!due || due.length === 0) {
    return new Response(JSON.stringify({ fired_count: 0 }), { status: 200 });
  }

  // Mark as fired — DB trigger `notify_reminder_due` (§6) inserts into `notifications`.
  // Do not duplicate a `notifications` insert here when that trigger is deployed.
  for (const reminder of due) {
    await supabase
      .from("inquiry_reminders")
      .update({ status: "fired", fired_at: new Date().toISOString() })
      .eq("id", reminder.id);
  }

  return new Response(
    JSON.stringify({ fired_count: due.length }),
    { headers: { "Content-Type": "application/json" } }
  );
});
```

Deploy:
```bash
supabase functions deploy fire-reminders --no-verify-jwt
```

---

## 14. Generate TypeScript Types

After your schema is final, regenerate the TS types from your live database:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/types/database.ts
```

This replaces the hand-written types I provided with auto-generated ones that always stay in sync with your schema.

---

## 15. Wire Frontend to Supabase

Now replace the mock-data calls in the components with real Supabase queries.

### 15.1 Login form (`src/app/[locale]/(auth)/login/login-form.tsx`)

```typescript
import { createClient } from "@/lib/supabase/client";

async function onSubmit(data: LoginData) {
  setError(null);
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });
  if (error) {
    setError(t("invalidCredentials"));
    return;
  }
  router.push(`/${locale}/dashboard`);
}
```

### 15.2 Create the venue context provider

Create `src/lib/hooks/use-venue.ts`:

```typescript
"use client";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { VenueContext } from "@/lib/types/database";

export function useVenue() {
  const supabase = createClient();
  return useQuery<VenueContext>({
    queryKey: ["venue"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_venue_for_user");
      if (error) throw error;
      return data as VenueContext;
    },
    staleTime: 1000 * 60 * 30, // 30 min
  });
}
```

### 15.3 Replace dashboard mock with RPC

In `dashboard-content.tsx`:

```typescript
const { data: summary, isLoading } = useQuery({
  queryKey: ["dashboard", hallId],
  queryFn: async () => {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("get_dashboard_summary", {
      p_hall_id: hallId,
    });
    if (error) throw error;
    return data;
  },
});

// Replace `MOCK_DASHBOARD` with `summary`
```

### 15.4 Replace bookings list

In `bookings-content.tsx`:

```typescript
const { data: bookings = [] } = useQuery({
  queryKey: ["bookings", { search, statusFilter }],
  queryFn: async () => {
    const supabase = createClient();
    let q = supabase
      .from("bookings")
      .select("*, client:clients(*), hall:halls(*), package:packages(*)")
      .order("event_date", { ascending: false });

    if (statusFilter !== "all") q = q.eq("status", statusFilter);
    if (search) q = q.or(`client.name.ilike.%${search}%`);

    const { data, error } = await q;
    if (error) throw error;
    return data;
  },
});
```

### 15.5 Booking wizard submission

In `booking-wizard.tsx`, replace the mock submission:

```typescript
async function handleSubmit() {
  setIsSubmitting(true);
  const supabase = createClient();

  const { data: result, error } = await supabase.rpc("create_booking", {
    p_data: {
      hall_id: data.hallId,
      event_type_id: "...", // pick from event_record_types
      package_id: data.packageId,
      client_id: data.clientId,           // null if new
      client_name: data.clientName,        // used if new
      client_phone: data.clientPhone,
      event_date: data.eventDate,
      shift: data.shift,
      start_time: shiftToStartTime(data.shift),
      end_time: shiftToEndTime(data.shift),
      status: data.status,
      source: data.source,
      total_amount: parseFloat(data.totalAmount),
      guest_count: parseInt(data.guestCount),
      assigned_to: data.assignedTo,
      notes: data.notes,
      hold_expires_at: data.status === "on_hold" ? data.holdExpiresAt : null,
    },
  });

  if (error) {
    toast({ variant: "destructive", title: "Failed to create booking", description: error.message });
    setIsSubmitting(false);
    return;
  }

  toast({ variant: "success", title: "Booking created!" });
  queryClient.invalidateQueries({ queryKey: ["bookings"] });
  setIsSubmitting(false);
  handleClose();
}
```

### 15.6 Notification bell with realtime

In `notification-bell.tsx`:

```typescript
import { createClient } from "@/lib/supabase/client";

useEffect(() => {
  const supabase = createClient();

  // Initial fetch
  supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20)
    .then(({ data }) => setNotifications(data ?? []));

  // Subscribe to inserts
  const channel = supabase
    .channel("notifications")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "notifications" },
      (payload) => setNotifications((prev) => [payload.new as Notification, ...prev])
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}, []);
```

### 15.7 Mock-data files to delete

Once everything is wired up, you can delete:
- `src/lib/mock-data.ts`

And remove all `MOCK_*` imports across the codebase.

---

## 16. Test Multi-Tenancy (Critical)

This is the **most important** test before going live.

1. Create **Venue A** with **User A** (e.g., `nada@a.com`).
2. Create **Venue B** with **User B** (e.g., `omar@b.com`).
3. As User A, create a booking, an inquiry, and a client.
4. Open an incognito window, log in as User B.
5. **Verify User B sees ZERO data from Venue A.**
6. Try to access User A's booking by URL (`/en/bookings/<a-id>`) — must return 404 / not found.
7. Try direct DB access via the JS client:
   ```js
   await supabase.from("bookings").select("*").eq("id", "<venue-a-booking-id>");
   // Should return empty array, not the booking
   ```

If any test fails, **stop** and revisit your RLS policies in section 7.

---

## 17. Pre-Launch Checklist

Before onboarding the first paying venue:

- [ ] All tables have RLS enabled (run `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';`)
- [ ] Multi-tenancy test (section 16) passes
- [ ] Indexes created (section 5) — verify with `\d+ bookings` in psql
- [ ] All triggers active
- [ ] Backups enabled (Pro plan only)
- [ ] **Upgrade Supabase to Pro plan** ($25/mo) — Free pauses after 1 week idle
- [ ] Generate fresh TS types after final schema (section 14)
- [ ] `.env.local` is in `.gitignore` (it already is)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is **never** committed or used in client code
- [ ] Test signup flow on a clean account
- [ ] Test reminder firing end-to-end (set reminder → wait 5 min → notification appears)
- [ ] Test hold expiry (manual SQL: set `hold_expires_at` to 1 hour ago, wait for cron)
- [ ] Mobile responsiveness check
- [ ] Arabic RTL pass on every page
- [ ] Set up monitoring: Supabase Logs → Pro tier
- [ ] Vercel deployment with production env vars

---

## Support & Troubleshooting

### "permission denied for table X"
RLS is enabled but no policy applies to your operation. Check the `WITH CHECK` clause for INSERT/UPDATE.

### "violates check constraint shift_xor_slot"
Booking has both `shift` and `slot_id` set, or neither. Exactly one must be set per booking.

### Reminder not firing
1. Check `pg_cron` is enabled.
2. Check `cron.job_run_details` table for failures: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;`
3. Verify Edge Function URL and service role key in cron job.

### Realtime notifications not appearing
1. Confirm `notifications` table has Realtime enabled in dashboard.
2. Check browser console for subscription errors.
3. Verify the `user_id` in the notification matches `auth.uid()`.

---

That's it. Once all sections are completed, the app is fully wired to a production-ready Supabase backend.
