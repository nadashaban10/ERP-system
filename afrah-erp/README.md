# Afrah ERP — Venue Management System

A modern, multi-tenant SaaS ERP built for Egyptian wedding venues.

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS v4 |
| Components | Custom UI built on Radix UI primitives |
| Forms | react-hook-form + Zod |
| Calendar | FullCalendar.js |
| Tables | TanStack Table |
| Data | TanStack Query + Supabase |
| i18n | next-intl (Arabic + English, RTL) |
| Backend | Supabase (Postgres + Auth + Storage + Realtime) |
| Hosting | Vercel |

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Configure Supabase (when ready)
Copy `.env.local` and fill in your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

> The app runs fully with **mock data** until Supabase is connected.

### 3. Run the dev server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Demo login**: any email + any password works (mock auth).

---

## Pages

| Route | Description |
|-------|-------------|
| `/dashboard` | Overview widgets, today's events, overdue follow-ups |
| `/calendar` | FullCalendar month/week view with booking events |
| `/bookings` | Searchable booking list with status filters |
| `/bookings/[id]` | Booking detail with payments + edit history |
| `/inquiries` | Lead tracking with no-response counter |
| `/inquiries/[id]` | Inquiry detail with reminder timeline |
| `/clients` | Client database with booking history |
| `/settings` | Venue profile, halls, packages, Supabase config |

---

## Key Components

- **BookingWizard** — 4-step modal: Client → Date/Time → Package → Confirm
- **NotificationBell** — Realtime notification dropdown in topbar
- **SetPendingSheet** — Set inquiry pending with scheduled call reminder
- **LogOutcomeSheet** — Log call outcome: answered / no response / convert
- **ReminderTimeline** — Full reminder history per inquiry
- **EditBookingSheet** — Edit booking with financial resolution for package changes
- **PaymentHistory** — Log payments with progress bar

---

## Connecting Supabase

See **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** for the full step-by-step integration guide, including:

- Creating the Supabase project
- Full SQL schema (all 13 tables)
- Indexes & triggers
- Row Level Security policies
- All 13 RPC functions (with code)
- pg_cron scheduled jobs
- Edge Functions for reminders
- Frontend wiring (replacing mock data)
- Multi-tenancy testing checklist

All Supabase types are already defined in `src/lib/types/database.ts`.
All RPC signatures are pre-stubbed in the components — search for `// TODO: supabase.rpc(...)`.

---

## i18n

Switch language in the topbar. URLs are prefixed with `/en/` or `/ar/`.
Arabic mode switches to RTL layout automatically.

Add translations in:
- `src/i18n/messages/en.json`
- `src/i18n/messages/ar.json`

---

## Project Structure

```
src/
├── app/[locale]/
│   ├── (auth)/login/        Login page
│   └── (app)/               Protected app shell
│       ├── dashboard/
│       ├── calendar/
│       ├── bookings/[id]/
│       ├── inquiries/[id]/
│       ├── clients/
│       └── settings/
├── components/
│   ├── ui/                  Radix-based UI primitives
│   ├── layout/              Sidebar, Topbar, NotificationBell
│   ├── booking/             BookingWizard, EditBookingSheet, PaymentHistory
│   ├── inquiry/             SetPendingSheet, LogOutcomeSheet, ReminderTimeline
│   └── shared/              StatusBadge, HallSelector
├── lib/
│   ├── supabase/            Client + Server helpers
│   ├── types/database.ts    Full DB type definitions
│   ├── mock-data.ts         Dev mock data
│   └── utils.ts             Formatting utilities
└── i18n/
    ├── routing.ts
    ├── request.ts
    └── messages/en.json + ar.json
```

---

## Demo Accounts

All demo accounts share the same password: **`Admin1234`**

> ⚠️ **For development only.** Rotate or remove these accounts before going to production.

### Super Admins
Full access to every venue and every feature.

| Email | Role | Scope |
|-------|------|-------|
| `ammar260302@gmail.com` | `super_admin` | All venues |
| `nadashaban10@erp.com` | `super_admin` | All venues |
| `nadashapann@gmail.com` | `super_admin` | All venues |

### Venue Owners
Full access to the venues they own.

| Email | Role | Venues |
|-------|------|--------|
| `owner.cairo@afrah.io` | `owner` | Crystal Hall + Nile Gardens |
| `owner.alex@afrah.io` | `owner` | Royal Ballroom |

### Agents
Limited to the venues they're assigned to.

| Email | Role | Venues |
|-------|------|--------|
| `agent1.cairo@afrah.io` | `agent` | Crystal Hall only |
| `agent2.cairo@afrah.io` | `agent` | Crystal Hall + Nile Gardens |
| `agent1.nile@afrah.io` | `agent` | Nile Gardens only |
| `agent1.alex@afrah.io` | `agent` | Royal Ballroom only |
