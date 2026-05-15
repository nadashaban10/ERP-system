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
  /** When set, owner-scoped venue lists use this (multi-venue products). */
  owner_user_id?: string | null;
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
  /** Agent workload scoping (see RLS + app filter for `role === 'agent'`). */
  assigned_agent_id?: string | null;
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
  /** Agent workload scoping. */
  assigned_agent_id?: string | null;
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

/** Agent ↔ venue assignments (multi-venue agents). Role lives on `profiles`. */
export interface UserVenue {
  id: string;
  user_id: string;
  venue_id: string;
  created_at: string;
}

/** Public profile row for admin / owner management UIs. */
export interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  status: string;
  created_at?: string;
}

export type ProfileStatus = "active" | "inactive" | "suspended";

export type SubscriptionPlan = "trial" | "starter" | "professional" | "enterprise";

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
  booking_id?: string;
}

export interface VenueContext {
  venue_id: string;
  venue_name: string;
  halls: Hall[];
  settings: Venue;
}

// ─── Database Root Type (for Supabase client) ─────────────────────────────────

// Supabase v2 requires every table to declare a `Relationships` field, AND
// each Row/Insert/Update must satisfy `Record<string, unknown>`.
//
// Plain TS `interface` declarations don't satisfy `Record<string, unknown>`
// (see TS issue #15300 — interfaces lack an implicit index signature).
// The `Idx<T>` helper recreates the type via a mapped type, which DOES get
// the implicit signature and so correctly satisfies Supabase's constraint.
//
// This is a temporary shim — replace this whole file with output from
// `npx supabase gen types typescript --project-id ...` once schema is finalized.
type Idx<T> = { [K in keyof T]: T[K] } & Record<string, unknown>;
type Rels = [];

export interface Database {
  public: {
    Tables: {
      venues: { Row: Idx<Venue>; Insert: Idx<Omit<Venue, "id" | "created_at">>; Update: Idx<Partial<Venue>>; Relationships: Rels };
      halls: { Row: Idx<Hall>; Insert: Idx<Omit<Hall, "id" | "created_at">>; Update: Idx<Partial<Hall>>; Relationships: Rels };
      event_record_types: { Row: Idx<EventRecordType>; Insert: Idx<Omit<EventRecordType, "id">>; Update: Idx<Partial<EventRecordType>>; Relationships: Rels };
      hall_slots: { Row: Idx<HallSlot>; Insert: Idx<Omit<HallSlot, "id">>; Update: Idx<Partial<HallSlot>>; Relationships: Rels };
      packages: { Row: Idx<Package>; Insert: Idx<Omit<Package, "id" | "created_at">>; Update: Idx<Partial<Package>>; Relationships: Rels };
      clients: { Row: Idx<Client>; Insert: Idx<Omit<Client, "id" | "created_at">>; Update: Idx<Partial<Client>>; Relationships: Rels };
      bookings: {
        Row: Idx<Booking>;
        Insert: Idx<Omit<Booking, "id" | "created_at" | "updated_at" | "amount_paid" | "amount_outstanding" | "edit_count">>;
        Update: Idx<Partial<Booking>>;
        Relationships: [
          {
            foreignKeyName: "bookings_client_id_fkey";
            columns: ["client_id"];
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_hall_id_fkey";
            columns: ["hall_id"];
            referencedRelation: "halls";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_package_id_fkey";
            columns: ["package_id"];
            referencedRelation: "packages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_event_type_id_fkey";
            columns: ["event_type_id"];
            referencedRelation: "event_record_types";
            referencedColumns: ["id"];
          },
        ];
      };
      payments: { Row: Idx<Payment>; Insert: Idx<Omit<Payment, "id" | "created_at">>; Update: Idx<Partial<Payment>>; Relationships: Rels };
      inquiries: {
        Row: Idx<Inquiry>;
        Insert: Idx<Omit<Inquiry, "id" | "created_at" | "updated_at" | "no_response_count">>;
        Update: Idx<Partial<Inquiry>>;
        Relationships: [
          {
            foreignKeyName: "inquiries_client_id_fkey";
            columns: ["client_id"];
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      inquiry_reminders: { Row: Idx<InquiryReminder>; Insert: Idx<Omit<InquiryReminder, "id" | "created_at">>; Update: Idx<Partial<InquiryReminder>>; Relationships: Rels };
      notifications: { Row: Idx<Notification>; Insert: Idx<Omit<Notification, "id" | "created_at">>; Update: Idx<Partial<Notification>>; Relationships: Rels };
      booking_edit_history: { Row: Idx<BookingEditHistory>; Insert: Idx<Omit<BookingEditHistory, "id" | "created_at">>; Update: Idx<Partial<BookingEditHistory>>; Relationships: Rels };
      profiles: {
        Row: Idx<Profile>;
        Insert: Idx<Partial<Profile>>;
        Update: Idx<Partial<Profile>>;
        Relationships: Rels;
      };
      user_venues: {
        Row: Idx<UserVenue>;
        Insert: Idx<Omit<UserVenue, "id" | "created_at">>;
        Update: Idx<Partial<UserVenue>>;
        Relationships: Rels;
      };
    };
    // Supabase's GenericSchema requires Views; we have none yet.
    Views: Record<string, never>;
    // Required by Supabase typed client; populated when running gen-types.
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
    Functions: {
      get_venue_for_user: { Args: Record<string, never>; Returns: VenueContext };
      // Returns a JSON blob with current user's profile + venue/role context.
      // (Use generated types from Supabase later for exact shape.)
      get_my_profile: { Args: Record<string, never>; Returns: Json };
      /** Backend returns JSON (see SUPABASE_SETUP); shape differs from `DashboardSummary`. */
      get_dashboard_summary: { Args: { p_hall_id: string | null }; Returns: Json };
      check_availability: {
        Args: {
          p_hall_id: string;
          p_event_date: string;
          p_shift: ShiftEnum;
          p_exclude_booking?: string | null;
        };
        Returns: AvailabilityResult;
      };
      check_slot_overlap: { Args: { hall_id: string; date: string; start_time: string; end_time: string; exclude_booking_id?: string }; Returns: { available: boolean } };
      /** Payload key must match SQL parameter name (`p_data`). Returns JSON with booking_id / client_id or { error, detail }. */
      create_booking: { Args: { p_data: Json }; Returns: Json };
      reschedule_booking: { Args: { booking_id: string; new_date: string; new_shift: ShiftEnum; new_hall_id?: string }; Returns: { success: boolean } };
      cancel_booking: {
        Args: {
          p_booking_id: string;
          p_reason: CancellationReason;
          p_notes?: string | null;
        };
        Returns: { success: boolean; outstanding_egp: number };
      };
      is_edit_allowed: {
        Args: { p_booking_id: string; p_override?: boolean | null };
        Returns: { allowed: boolean; reason?: string; days_remaining?: number };
      };
      edit_booking: {
        Args: {
          p_booking_id: string;
          p_changes: Json;
          p_financial_resolution?: Json | null;
          p_agent_notes?: string | null;
          p_override_cutoff?: boolean | null;
        };
        Returns: Json;
      };
      convert_inquiry_to_booking: { Args: { p_inquiry_id: string; p_booking_data: Json }; Returns: Json };
      set_inquiry_pending: {
        Args: {
          p_inquiry_id: string;
          p_reason: PendingReason;
          p_notes: string;
          p_reminder_data: Json;
        };
        Returns: Json;
      };
      resolve_reminder: {
        Args: {
          p_reminder_id: string;
          p_outcome: ReminderOutcome;
          p_outcome_notes: string;
          p_next_call_at?: string | null;
        };
        Returns: Json;
      };
      log_no_response: {
        Args: {
          p_reminder_id: string;
          p_notes?: string | null;
          p_next_call_at?: string | null;
        };
        Returns: Json;
      };
      log_payment: {
        Args: {
          p_booking_id: string;
          p_amount: number;
          p_method: PaymentMethod;
          p_paid_at: string;
          p_milestone?: string | null;
          p_proof_url?: string | null;
          p_notes?: string | null;
        };
        Returns: Json;
      };
      update_agent_venues: {
        Args: { p_agent_id: string; p_venue_ids: string[] };
        Returns: Json;
      };
      deactivate_user: {
        Args: { p_user_id: string; p_reason?: string | null };
        Returns: Json;
      };
      create_venue: {
        Args: {
          p_venue_data: Json;
          p_owner_id?: string | null;
          p_owner_role?: string | null;
        };
        Returns: Json;
      };
    };
  };
}
