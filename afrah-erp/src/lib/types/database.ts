/**
 * Afrah ERP — Supabase Database Type Definitions
 * These types mirror the database schema defined in the technical spec.
 * Replace with generated types once Supabase project is connected:
 *   npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/types/database.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ─── Enums ────────────────────────────────────────────────────────────────────

export type VenueType = "hall" | "hotel" | "garden" | "boat" | "other";
export type CityEnum = "cairo" | "giza" | "alexandria" | "other";
export type TimeModel = "shift_based" | "slot_based";
export type PriceType = "flat_rate" | "per_person";
export type ShiftEnum = "morning" | "evening" | "full_day";
export type BookingStatus =
  | "inquiry"
  | "on_hold"
  | "confirmed"
  | "completed"
  | "cancelled";
export type BookingSource = "online" | "phone" | "walk_in" | "agent";
export type CancellationReason =
  | "customer_not_reached"
  | "chose_another_venue"
  | "budget_too_high"
  | "date_not_available"
  | "no_longer_getting_married"
  | "unresponsive_no_contact"
  | "hold_expired"
  | "other";
export type InquiryStatus =
  | "new"
  | "contacted"
  | "pending"
  | "toured"
  | "quoted"
  | "converted"
  | "cancelled";
export type InquirySource =
  | "phone"
  | "walk_in"
  | "whatsapp"
  | "instagram"
  | "other";
export type PendingReason = "call_again" | "pending_deposit";
export type PaymentMethod =
  | "cash"
  | "bank_transfer"
  | "instapay"
  | "fawry"
  | "vodafone_cash"
  | "card"
  | "adjustment";
export type ReminderType = "scheduled_call" | "deposit_follow_up";
export type ReminderStatus = "pending" | "fired" | "dismissed" | "completed";
export type ReminderOutcome =
  | "converted"
  | "rescheduled"
  | "cancelled"
  | "no_response";
export type NotificationType =
  | "reminder_due"
  | "hold_expiring"
  | "payment_overdue";
export type UserRole = "owner" | "manager" | "staff";
export type EditType =
  | "hall"
  | "date_shift"
  | "package"
  | "guest_count"
  | "notes"
  | "combined";

// ─── Table Row Types ───────────────────────────────────────────────────────────

export interface Venue {
  id: string;
  name_ar: string;
  name_en: string;
  type: VenueType;
  address: string;
  city: CityEnum;
  district: string | null;
  phone_1: string;
  phone_2: string | null;
  instagram: string | null;
  facebook: string | null;
  description_ar: string | null;
  description_en: string | null;
  logo_url: string | null;
  marketplace_active: boolean;
  edit_cutoff_days: number;
  edit_cutoff_override: boolean;
  created_at: string;
}

export interface Hall {
  id: string;
  venue_id: string;
  name: string;
  capacity_min: number | null;
  capacity_max: number;
  amenities: string[];
  is_active: boolean;
  created_at: string;
}

export interface EventRecordType {
  id: string;
  hall_id: string;
  name: string;
  time_model: TimeModel;
  is_active: boolean;
}

export interface HallSlot {
  id: string;
  hall_id: string;
  event_type_id: string;
  name: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export interface Package {
  id: string;
  venue_id: string;
  name: string;
  price_type: PriceType;
  base_price: number;
  min_guests: number | null;
  inclusions: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Client {
  id: string;
  venue_id: string;
  name: string;
  phone_1: string;
  phone_2: string | null;
  email: string | null;
  notes: string | null;
  created_at: string;
}

export interface Booking {
  id: string;
  venue_id: string;
  hall_id: string;
  event_type_id: string;
  package_id: string | null;
  client_id: string;
  event_date: string;
  shift: ShiftEnum | null;
  slot_id: string | null;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  source: BookingSource;
  total_amount: number | null;
  amount_paid: number;
  amount_outstanding: number;
  guest_count: number | null;
  assigned_to: string | null;
  notes: string | null;
  hold_expires_at: string | null;
  cancellation_reason: CancellationReason | null;
  last_edited_at: string | null;
  last_edited_by: string | null;
  edit_count: number;
  created_at: string;
  updated_at: string;
  // Joined fields (not in DB — added by queries)
  client?: Client;
  hall?: Hall;
  package?: Package;
}

export interface Payment {
  id: string;
  booking_id: string;
  venue_id: string;
  amount: number;
  method: PaymentMethod;
  paid_at: string;
  milestone: string | null;
  proof_url: string | null;
  logged_by: string;
  notes: string | null;
  created_at: string;
}

export interface Inquiry {
  id: string;
  venue_id: string;
  client_id: string;
  desired_date: string | null;
  alt_date: string | null;
  guest_count: number | null;
  package_interest: string | null;
  source: InquirySource;
  status: InquiryStatus;
  pending_reason: PendingReason | null;
  pending_notes: string | null;
  cancellation_reason: CancellationReason | null;
  no_response_count: number;
  last_attempt_at: string | null;
  booking_id: string | null;
  follow_up_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  client?: Client;
}

export interface InquiryReminder {
  id: string;
  inquiry_id: string;
  venue_id: string;
  assigned_to: string;
  reminder_type: ReminderType;
  scheduled_at: string;
  status: ReminderStatus;
  outcome: ReminderOutcome | null;
  outcome_notes: string | null;
  fired_at: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  venue_id: string;
  type: NotificationType;
  title: string;
  body: string;
  reference_id: string | null;
  reference_type: "inquiry" | "booking" | null;
  is_read: boolean;
  created_at: string;
}

export interface BookingEditHistory {
  id: string;
  booking_id: string;
  venue_id: string;
  edited_by: string;
  edit_type: EditType;
  previous_values: Json;
  new_values: Json;
  financial_adjustment: Json | null;
  agent_notes: string | null;
  created_at: string;
}

export interface VenueUser {
  id: string;
  venue_id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
}

// ─── RPC Return Types ─────────────────────────────────────────────────────────

export interface DashboardSummary {
  today_bookings: Booking[];
  week_count: number;
  outstanding_egp: number;
  overdue_followups_count: number;
  expiring_holds: Booking[];
}

export interface AvailabilityResult {
  available: boolean;
  status?: BookingStatus;
  client_name?: string;
}

export interface VenueContext {
  venue_id: string;
  venue_name: string;
  halls: Hall[];
  settings: Venue;
}

// ─── Database Root Type (for Supabase client) ─────────────────────────────────

export interface Database {
  public: {
    Tables: {
      venues: { Row: Venue; Insert: Omit<Venue, "id" | "created_at">; Update: Partial<Venue> };
      halls: { Row: Hall; Insert: Omit<Hall, "id" | "created_at">; Update: Partial<Hall> };
      event_record_types: { Row: EventRecordType; Insert: Omit<EventRecordType, "id">; Update: Partial<EventRecordType> };
      hall_slots: { Row: HallSlot; Insert: Omit<HallSlot, "id">; Update: Partial<HallSlot> };
      packages: { Row: Package; Insert: Omit<Package, "id" | "created_at">; Update: Partial<Package> };
      clients: { Row: Client; Insert: Omit<Client, "id" | "created_at">; Update: Partial<Client> };
      bookings: { Row: Booking; Insert: Omit<Booking, "id" | "created_at" | "updated_at" | "amount_paid" | "amount_outstanding" | "edit_count">; Update: Partial<Booking> };
      payments: { Row: Payment; Insert: Omit<Payment, "id" | "created_at">; Update: Partial<Payment> };
      inquiries: { Row: Inquiry; Insert: Omit<Inquiry, "id" | "created_at" | "updated_at" | "no_response_count">; Update: Partial<Inquiry> };
      inquiry_reminders: { Row: InquiryReminder; Insert: Omit<InquiryReminder, "id" | "created_at">; Update: Partial<InquiryReminder> };
      notifications: { Row: Notification; Insert: Omit<Notification, "id" | "created_at">; Update: Partial<Notification> };
      booking_edit_history: { Row: BookingEditHistory; Insert: Omit<BookingEditHistory, "id" | "created_at">; Update: Partial<BookingEditHistory> };
      venue_users: { Row: VenueUser; Insert: Omit<VenueUser, "id" | "created_at">; Update: Partial<VenueUser> };
    };
    Functions: {
      get_venue_for_user: { Args: Record<string, never>; Returns: VenueContext };
      // Returns a JSON blob with current user's profile + venue/role context.
      // (Use generated types from Supabase later for exact shape.)
      get_my_profile: { Args: Record<string, never>; Returns: Json };
      get_dashboard_summary: { Args: { hall_id?: string }; Returns: DashboardSummary };
      check_availability: { Args: { hall_id: string; date: string; shift: ShiftEnum; exclude_booking_id?: string }; Returns: AvailabilityResult };
      check_slot_overlap: { Args: { hall_id: string; date: string; start_time: string; end_time: string; exclude_booking_id?: string }; Returns: { available: boolean } };
      create_booking: { Args: { booking_data: Json }; Returns: { booking_id: string } };
      reschedule_booking: { Args: { booking_id: string; new_date: string; new_shift: ShiftEnum; new_hall_id?: string }; Returns: { success: boolean } };
      cancel_booking: { Args: { booking_id: string; reason: CancellationReason; notes?: string }; Returns: { success: boolean; outstanding_egp: number } };
      is_edit_allowed: { Args: { booking_id: string; override?: boolean }; Returns: { allowed: boolean; reason?: string; days_remaining?: number } };
      edit_booking: { Args: { booking_id: string; changes: Json; financial_resolution?: Json; agent_notes?: string; override_cutoff?: boolean }; Returns: { success: boolean; edit_count: number } };
      convert_inquiry_to_booking: { Args: { inquiry_id: string; booking_data: Json }; Returns: { booking_id: string } };
      set_inquiry_pending: { Args: { inquiry_id: string; pending_reason: PendingReason; pending_notes: string; reminder_data: Json }; Returns: { reminder_id: string } };
      resolve_reminder: { Args: { reminder_id: string; outcome: ReminderOutcome; outcome_notes: string; next_call_at?: string }; Returns: { action: string; next_reminder_id?: string } };
      log_no_response: { Args: { reminder_id: string; notes?: string; next_call_at?: string }; Returns: { action: "rescheduled" | "auto_closed"; attempt?: number } };
      log_payment: { Args: { booking_id: string; amount: number; method: PaymentMethod; paid_at: string; milestone?: string; proof_url?: string; notes?: string }; Returns: { payment_id: string } };
    };
  };
}
