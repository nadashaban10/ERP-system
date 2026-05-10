/**
 * Mock data for development.
 *
 * Modules already migrated to real Supabase data are removed from here.
 * Remaining mocks will go away as the matching module is integrated.
 *
 *   ✅ Module 1 (Venue settings) — MOCK_VENUE removed
 *   ✅ Module 2 (Dashboard) — live queries; MOCK_DASHBOARD unused (kept for reference)
 *   ✅ Module 3 (Clients) — live queries; MOCK_CLIENTS here only seeds embedded rows for mock bookings
 *   ✅ Module 5 — Bookings live; calendar uses ranged Supabase booking query (+ hall URL param)
 *   ✅ Module 6 (Payments) — booking detail loads payments + log_payment RPC; MOCK_PAYMENTS retained for reference
 *   ✅ Module 7 (Inquiries) — list/detail live; reminders from Supabase + RPCs wired; MOCK_REMINDERS + MOCK_INQUIRIES retained for MOCK_DASHBOARD / reference seeds only
 *   ✅ Module 8 (Notifications) — top bar bell uses notifications table; MOCK_NOTIFICATIONS retained for reference
 */

import type {
  Hall,
  Client,
  Booking,
  Inquiry,
  Package,
  Payment,
  Notification,
  InquiryReminder,
  BookingEditHistory,
} from "@/lib/types/database";

// ─── Halls (still used by Modules 2 + 5 — remove after those migrate) ────────

export const MOCK_HALLS: Hall[] = [
  {
    id: "h1",
    venue_id: "v1",
    name: "Crystal Ballroom",
    capacity_min: 100,
    capacity_max: 500,
    amenities: ["AC", "Parking", "Generator", "Stage", "Sound System"],
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "h2",
    venue_id: "v1",
    name: "Garden Terrace",
    capacity_min: 50,
    capacity_max: 200,
    amenities: ["Outdoor", "Parking", "Lighting"],
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "h3",
    venue_id: "v1",
    name: "Royal Suite",
    capacity_min: 20,
    capacity_max: 80,
    amenities: ["AC", "Catering Kitchen", "Private Entrance"],
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
  },
];

// ─── Packages ─────────────────────────────────────────────────────────────────

export const MOCK_PACKAGES: Package[] = [
  {
    id: "p1",
    venue_id: "v1",
    name: "Bronze Package",
    price_type: "per_person",
    base_price: 800,
    min_guests: 100,
    inclusions: "Hall rental, basic catering, standard lighting",
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "p2",
    venue_id: "v1",
    name: "Silver Package",
    price_type: "per_person",
    base_price: 1200,
    min_guests: 150,
    inclusions: "Hall rental, premium catering, decorations, DJ",
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "p3",
    venue_id: "v1",
    name: "Gold Package",
    price_type: "per_person",
    base_price: 1800,
    min_guests: 200,
    inclusions:
      "Hall rental, luxury catering, full decorations, DJ, photography, fireworks",
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "p4",
    venue_id: "v1",
    name: "Corporate Event",
    price_type: "flat_rate",
    base_price: 15000,
    min_guests: null,
    inclusions: "Hall rental, AV equipment, catering, staff",
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
  },
];

// ─── Clients ──────────────────────────────────────────────────────────────────

export const MOCK_CLIENTS: Client[] = [
  {
    id: "c1",
    venue_id: "v1",
    name: "أحمد محمد السيد",
    phone_1: "01001112233",
    phone_2: "01201112233",
    email: "ahmed@email.com",
    notes: "VIP client — prefers evening bookings",
    created_at: "2024-02-01T00:00:00Z",
  },
  {
    id: "c2",
    venue_id: "v1",
    name: "فاطمة علي حسن",
    phone_1: "01112223344",
    phone_2: null,
    email: null,
    notes: null,
    created_at: "2024-03-15T00:00:00Z",
  },
  {
    id: "c3",
    venue_id: "v1",
    name: "محمود عبد الرحمن",
    phone_1: "01223334455",
    phone_2: "01523334455",
    email: "mahmoud@company.eg",
    notes: "Corporate account",
    created_at: "2024-04-10T00:00:00Z",
  },
  {
    id: "c4",
    venue_id: "v1",
    name: "سارة إبراهيم خليل",
    phone_1: "01334445566",
    phone_2: null,
    email: "sara.ibrahim@gmail.com",
    notes: null,
    created_at: "2024-05-20T00:00:00Z",
  },
  {
    id: "c5",
    venue_id: "v1",
    name: "Omar Hassan Fathy",
    phone_1: "01445556677",
    phone_2: null,
    email: "omar@email.com",
    notes: null,
    created_at: "2024-06-01T00:00:00Z",
  },
];

// ─── Bookings ─────────────────────────────────────────────────────────────────

const today = new Date();
const fmt = (d: Date) => d.toISOString().split("T")[0];
const addDays = (d: Date, n: number) => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};

export const MOCK_BOOKINGS: Booking[] = [
  {
    id: "b1",
    venue_id: "v1",
    hall_id: "h1",
    event_type_id: "et1",
    package_id: "p3",
    client_id: "c1",
    event_date: fmt(addDays(today, 7)),
    shift: "evening",
    slot_id: null,
    start_time: "18:00",
    end_time: "23:59",
    status: "confirmed",
    source: "phone",
    total_amount: 360000,
    amount_paid: 180000,
    amount_outstanding: 180000,
    guest_count: 200,
    assigned_to: "Nada",
    notes: "Bride wants extra flowers at the entrance",
    hold_expires_at: null,
    cancellation_reason: null,
    last_edited_at: null,
    last_edited_by: null,
    edit_count: 0,
    created_at: "2024-05-01T10:00:00Z",
    updated_at: "2024-05-01T10:00:00Z",
    client: MOCK_CLIENTS[0],
    hall: MOCK_HALLS[0],
    package: MOCK_PACKAGES[2],
  },
  {
    id: "b2",
    venue_id: "v1",
    hall_id: "h2",
    event_type_id: "et1",
    package_id: "p2",
    client_id: "c2",
    event_date: fmt(today),
    shift: "morning",
    slot_id: null,
    start_time: "09:00",
    end_time: "15:00",
    status: "confirmed",
    source: "walk_in",
    total_amount: 180000,
    amount_paid: 180000,
    amount_outstanding: 0,
    guest_count: 150,
    assigned_to: "Sara",
    notes: null,
    hold_expires_at: null,
    cancellation_reason: null,
    last_edited_at: null,
    last_edited_by: null,
    edit_count: 0,
    created_at: "2024-04-20T09:00:00Z",
    updated_at: "2024-04-20T09:00:00Z",
    client: MOCK_CLIENTS[1],
    hall: MOCK_HALLS[1],
    package: MOCK_PACKAGES[1],
  },
  {
    id: "b3",
    venue_id: "v1",
    hall_id: "h3",
    event_type_id: "et2",
    package_id: "p4",
    client_id: "c3",
    event_date: fmt(addDays(today, 14)),
    shift: "full_day",
    slot_id: null,
    start_time: "09:00",
    end_time: "23:59",
    status: "on_hold",
    source: "online",
    total_amount: 15000,
    amount_paid: 3000,
    amount_outstanding: 12000,
    guest_count: 60,
    assigned_to: "Nada",
    notes: "Annual company gala",
    hold_expires_at: addDays(today, 3).toISOString(),
    cancellation_reason: null,
    last_edited_at: null,
    last_edited_by: null,
    edit_count: 0,
    created_at: "2024-05-10T11:00:00Z",
    updated_at: "2024-05-10T11:00:00Z",
    client: MOCK_CLIENTS[2],
    hall: MOCK_HALLS[2],
    package: MOCK_PACKAGES[3],
  },
  {
    id: "b4",
    venue_id: "v1",
    hall_id: "h1",
    event_type_id: "et1",
    package_id: "p2",
    client_id: "c4",
    event_date: fmt(addDays(today, 21)),
    shift: "evening",
    slot_id: null,
    start_time: "18:00",
    end_time: "23:59",
    status: "confirmed",
    source: "agent",
    total_amount: 240000,
    amount_paid: 50000,
    amount_outstanding: 190000,
    guest_count: 200,
    assigned_to: "Mohamed",
    notes: null,
    hold_expires_at: null,
    cancellation_reason: null,
    last_edited_at: null,
    last_edited_by: null,
    edit_count: 1,
    created_at: "2024-05-05T14:00:00Z",
    updated_at: "2024-05-12T16:00:00Z",
    client: MOCK_CLIENTS[3],
    hall: MOCK_HALLS[0],
    package: MOCK_PACKAGES[1],
  },
  {
    id: "b5",
    venue_id: "v1",
    hall_id: "h2",
    event_type_id: "et1",
    package_id: "p1",
    client_id: "c5",
    event_date: fmt(addDays(today, -30)),
    shift: "evening",
    slot_id: null,
    start_time: "18:00",
    end_time: "23:59",
    status: "completed",
    source: "phone",
    total_amount: 80000,
    amount_paid: 80000,
    amount_outstanding: 0,
    guest_count: 100,
    assigned_to: "Nada",
    notes: "Great event",
    hold_expires_at: null,
    cancellation_reason: null,
    last_edited_at: null,
    last_edited_by: null,
    edit_count: 0,
    created_at: "2024-03-01T09:00:00Z",
    updated_at: "2024-04-06T10:00:00Z",
    client: MOCK_CLIENTS[4],
    hall: MOCK_HALLS[1],
    package: MOCK_PACKAGES[0],
  },
];

// ─── Inquiries ────────────────────────────────────────────────────────────────

export const MOCK_INQUIRIES: Inquiry[] = [
  {
    id: "i1",
    venue_id: "v1",
    client_id: "c1",
    desired_date: fmt(addDays(today, 60)),
    alt_date: fmt(addDays(today, 67)),
    guest_count: 250,
    package_interest: "Gold Package",
    source: "instagram",
    status: "new",
    pending_reason: null,
    pending_notes: null,
    cancellation_reason: null,
    no_response_count: 0,
    last_attempt_at: null,
    booking_id: null,
    follow_up_date: fmt(addDays(today, 2)),
    notes: "Interested in Gold Package for 250 guests",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    client: MOCK_CLIENTS[0],
  },
  {
    id: "i2",
    venue_id: "v1",
    client_id: "c2",
    desired_date: fmt(addDays(today, 45)),
    alt_date: null,
    guest_count: 150,
    package_interest: "Silver Package",
    source: "phone",
    status: "pending",
    pending_reason: "pending_deposit",
    pending_notes: "Waiting for deposit — promised to transfer by Sunday",
    cancellation_reason: null,
    no_response_count: 0,
    last_attempt_at: addDays(today, -1).toISOString(),
    booking_id: null,
    follow_up_date: fmt(addDays(today, 1)),
    notes: null,
    created_at: addDays(today, -3).toISOString(),
    updated_at: addDays(today, -1).toISOString(),
    client: MOCK_CLIENTS[1],
  },
  {
    id: "i3",
    venue_id: "v1",
    client_id: "c3",
    desired_date: fmt(addDays(today, 90)),
    alt_date: null,
    guest_count: 300,
    package_interest: "Gold Package",
    source: "walk_in",
    status: "contacted",
    pending_reason: null,
    pending_notes: null,
    cancellation_reason: null,
    no_response_count: 1,
    last_attempt_at: addDays(today, -2).toISOString(),
    booking_id: null,
    follow_up_date: fmt(addDays(today, 3)),
    notes: "Client visited the hall — very interested",
    created_at: addDays(today, -5).toISOString(),
    updated_at: addDays(today, -2).toISOString(),
    client: MOCK_CLIENTS[2],
  },
  {
    id: "i4",
    venue_id: "v1",
    client_id: "c4",
    desired_date: fmt(addDays(today, 30)),
    alt_date: fmt(addDays(today, 37)),
    guest_count: 100,
    package_interest: "Bronze Package",
    source: "whatsapp",
    status: "quoted",
    pending_reason: null,
    pending_notes: null,
    cancellation_reason: null,
    no_response_count: 0,
    last_attempt_at: addDays(today, -1).toISOString(),
    booking_id: null,
    follow_up_date: fmt(addDays(today, 5)),
    notes: "Sent quote via WhatsApp",
    created_at: addDays(today, -7).toISOString(),
    updated_at: addDays(today, -1).toISOString(),
    client: MOCK_CLIENTS[3],
  },
];

// ─── Payments ─────────────────────────────────────────────────────────────────

export const MOCK_PAYMENTS: Payment[] = [
  {
    id: "pay1",
    booking_id: "b1",
    venue_id: "v1",
    amount: 90000,
    method: "bank_transfer",
    paid_at: addDays(today, -60).toISOString().split("T")[0],
    milestone: "deposit",
    proof_url: null,
    logged_by: "user1",
    notes: "Initial deposit",
    created_at: addDays(today, -60).toISOString(),
  },
  {
    id: "pay2",
    booking_id: "b1",
    venue_id: "v1",
    amount: 90000,
    method: "instapay",
    paid_at: addDays(today, -30).toISOString().split("T")[0],
    milestone: "2nd_payment",
    proof_url: null,
    logged_by: "user1",
    notes: "Second installment",
    created_at: addDays(today, -30).toISOString(),
  },
];

// ─── Notifications ────────────────────────────────────────────────────────────

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    user_id: "user1",
    venue_id: "v1",
    type: "reminder_due",
    title: "Follow-up Required",
    body: "Reminder for فاطمة علي حسن is due now — deposit follow-up",
    reference_id: "i2",
    reference_type: "inquiry",
    is_read: false,
    created_at: new Date().toISOString(),
  },
  {
    id: "n2",
    user_id: "user1",
    venue_id: "v1",
    type: "hold_expiring",
    title: "Hold Expiring Soon",
    body: "Hold for محمود عبد الرحمن expires in 3 days",
    reference_id: "b3",
    reference_type: "booking",
    is_read: false,
    created_at: addDays(today, -1).toISOString(),
  },
  {
    id: "n3",
    user_id: "user1",
    venue_id: "v1",
    type: "payment_overdue",
    title: "Payment Outstanding",
    body: "سارة إبراهيم خليل has EGP 190,000 outstanding",
    reference_id: "b4",
    reference_type: "booking",
    is_read: true,
    created_at: addDays(today, -2).toISOString(),
  },
];

// ─── Edit History ─────────────────────────────────────────────────────────────

export const MOCK_EDIT_HISTORY: BookingEditHistory[] = [
  {
    id: "eh1",
    booking_id: "b4",
    venue_id: "v1",
    edited_by: "user1",
    edit_type: "package",
    previous_values: { package_id: "p1", total_amount: 80000 },
    new_values: { package_id: "p2", total_amount: 240000 },
    financial_adjustment: {
      type: "upgrade",
      diff: 160000,
      resolution: "client_will_pay_difference",
    },
    agent_notes: "Client upgraded from Bronze to Silver",
    created_at: addDays(today, -7).toISOString(),
  },
];

// ─── Reminders ────────────────────────────────────────────────────────────────

export const MOCK_REMINDERS: InquiryReminder[] = [
  {
    id: "r1",
    inquiry_id: "i2",
    venue_id: "v1",
    assigned_to: "user1",
    reminder_type: "deposit_follow_up",
    scheduled_at: addDays(today, 1).toISOString(),
    status: "pending",
    outcome: null,
    outcome_notes: null,
    fired_at: null,
    created_at: addDays(today, -1).toISOString(),
  },
];

// ─── Dashboard Summary ────────────────────────────────────────────────────────

export const MOCK_DASHBOARD = {
  today_bookings: MOCK_BOOKINGS.filter(
    (b) => b.event_date === fmt(today) && b.status !== "cancelled"
  ),
  week_count: MOCK_BOOKINGS.filter((b) => {
    const d = new Date(b.event_date);
    const diff = (d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7 && b.status !== "cancelled";
  }).length,
  outstanding_egp: MOCK_BOOKINGS.reduce(
    (sum, b) => sum + (b.amount_outstanding || 0),
    0
  ),
  overdue_followups_count: MOCK_INQUIRIES.filter(
    (i) =>
      i.follow_up_date &&
      new Date(i.follow_up_date) <= today &&
      i.status !== "cancelled" &&
      i.status !== "converted"
  ).length,
  expiring_holds: MOCK_BOOKINGS.filter((b) => {
    if (b.status !== "on_hold" || !b.hold_expires_at) return false;
    const diff =
      (new Date(b.hold_expires_at).getTime() - today.getTime()) /
      (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  }),
};
