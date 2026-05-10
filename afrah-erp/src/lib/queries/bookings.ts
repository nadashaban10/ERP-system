"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type {
  AvailabilityResult,
  Booking,
  BookingEditHistory,
  BookingSource,
  BookingStatus,
  CancellationReason,
  Client,
  Hall,
  Json,
  Package,
  ShiftEnum,
} from "@/lib/types/database";
import { shiftTimeWindow } from "@/lib/booking/shift-times";
import { queryKeys } from "@/lib/queries/keys";
import {
  showMutationError,
  unwrapMutation,
  unwrapQuery,
} from "@/lib/queries/helpers";
import type { PostgrestError } from "@supabase/supabase-js";

const BOOKING_LIST_SELECT =
  "*,clients(*),halls(id,name,venue_id,capacity_min,capacity_max,amenities,is_active,created_at),packages(id,name,venue_id,price_type,base_price,min_guests,inclusions,is_active,created_at)";

type BookingJoinRow = Booking & {
  clients: Client | null;
  halls: Hall | null;
  packages: Package | null;
};

export function normalizeBookingJoinRow(row: BookingJoinRow): Booking {
  const { clients, halls, packages, ...rest } = row;
  return {
    ...rest,
    client: clients ?? undefined,
    hall: halls ?? undefined,
    package: packages ?? undefined,
  };
}

export type BookingsListFilters = {
  hallId: string | null;
  status: string;
  clientId: string | null;
  sortAsc: boolean;
};

/** Visible calendar range (`toExclusive` is the first day *after* the last visible day; matches FullCalendar `end`). */
export type CalendarBookingsRange = {
  fromInclusive: string;
  toExclusive: string;
  hallId: string | null;
};

export function useCalendarBookings(range: CalendarBookingsRange | null) {
  return useQuery({
    queryKey: range
      ? queryKeys.calendarBookings({
          from: range.fromInclusive,
          to: range.toExclusive,
          hallId: range.hallId,
        })
      : (["calendar", "bookings", "pending"] as const),
    enabled:
      !!range &&
      !!range.fromInclusive &&
      !!range.toExclusive &&
      range.fromInclusive < range.toExclusive,
    queryFn: async (): Promise<Booking[]> => {
      if (!range) return [];
      const supabase = createClient();
      let q = supabase
        .from("bookings")
        .select(BOOKING_LIST_SELECT)
        .gte("event_date", range.fromInclusive)
        .lt("event_date", range.toExclusive)
        .neq("status", "cancelled")
        .order("event_date", { ascending: true });

      if (range.hallId) {
        q = q.eq("hall_id", range.hallId);
      }

      const response = await q;
      const rows = unwrapQuery<BookingJoinRow[]>(response, [], "calendar bookings");
      return rows.map(normalizeBookingJoinRow);
    },
  });
}

export function useBookingsList(filters: BookingsListFilters) {
  return useQuery({
    queryKey: queryKeys.bookings({
      scope: "list",
      hallId: filters.hallId ?? "all",
      status: filters.status,
      clientId: filters.clientId ?? "all",
      sortAsc: filters.sortAsc,
    }),
    queryFn: async (): Promise<Booking[]> => {
      const supabase = createClient();
      let q = supabase
        .from("bookings")
        .select(BOOKING_LIST_SELECT)
        .order("event_date", { ascending: filters.sortAsc });

      if (filters.hallId) q = q.eq("hall_id", filters.hallId);
      if (filters.status && filters.status !== "all") {
        q = q.eq("status", filters.status as BookingStatus);
      }
      if (filters.clientId) q = q.eq("client_id", filters.clientId);

      const response = await q;
      const rows = unwrapQuery<BookingJoinRow[]>(response, [], "bookings list");
      return rows.map(normalizeBookingJoinRow);
    },
  });
}

export function useBookingDetail(id: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.booking(id ?? "__none__"),
    enabled: !!id,
    queryFn: async (): Promise<Booking | null> => {
      const supabase = createClient();
      const response = await supabase
        .from("bookings")
        .select(BOOKING_LIST_SELECT)
        .eq("id", id as string)
        .maybeSingle();
      const row = unwrapQuery<BookingJoinRow | null>(response, null, "booking detail");
      return row ? normalizeBookingJoinRow(row) : null;
    },
  });
}

export function useIsEditAllowed(bookingId: string | null | undefined) {
  return useQuery({
    queryKey: [...queryKeys.booking(bookingId ?? "__none__"), "editAllowed"] as const,
    enabled: !!bookingId,
    queryFn: async (): Promise<{ allowed: boolean; reason?: string }> => {
      const supabase = createClient();
      const response = await supabase.rpc("is_edit_allowed", {
        p_booking_id: bookingId as string,
        p_override: false,
      });
      const data = unwrapQuery<{ allowed?: boolean; reason?: string } | null>(
        response as {
          data: { allowed?: boolean; reason?: string } | null;
          error: PostgrestError | null;
        },
        null,
        "is_edit_allowed"
      );
      if (!data || typeof data !== "object") {
        return { allowed: true };
      }
      return {
        allowed: data.allowed !== false,
        reason: data.reason,
      };
    },
  });
}

/** Call `check_availability` with soft degradation when RPC/table is missing. */
export async function runCheckAvailabilityRpc(input: {
  hallId: string;
  date: string;
  shift: ShiftEnum | string;
  /** When rescheduling/editing, exclude this booking from the conflict check. */
  excludeBookingId?: string | null;
}): Promise<AvailabilityResult | null> {
  const supabase = createClient();
  /** Must match SQL parameter names (`p_event_date`, `p_exclude_booking`). */
  const response = await supabase.rpc("check_availability", {
    p_hall_id: input.hallId,
    p_event_date: input.date,
    p_shift: input.shift as ShiftEnum,
    p_exclude_booking: input.excludeBookingId ?? null,
  });
  type RpcRows = AvailabilityResult | null;
  const data = unwrapQuery(
    response as { data: RpcRows; error: PostgrestError | null },
    null,
    "check_availability"
  );
  return data;
}

/** Parses `create_booking` JSON response (success or business error like slot_unavailable). */
export function parseCreateBookingRpcResult(payload: Json): {
  booking_id: string;
  client_id?: string;
} {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("create booking: invalid response");
  }
  const o = payload as Record<string, unknown>;
  if (o.error === "slot_unavailable") {
    const detail = o.detail;
    let msg = "This slot is unavailable.";
    if (detail && typeof detail === "object" && !Array.isArray(detail)) {
      const d = detail as Record<string, unknown>;
      if (typeof d.client_name === "string" && d.client_name)
        msg = `${msg} (${d.client_name})`;
      else if (typeof d.booking_id === "string" && d.booking_id)
        msg = `${msg} (#${d.booking_id.slice(0, 8)})`;
    }
    throw new Error(msg);
  }
  const bookingId = o.booking_id;
  if (typeof bookingId !== "string") {
    throw new Error("create booking: missing booking_id");
  }
  const clientId = o.client_id;
  return {
    booking_id: bookingId,
    ...(typeof clientId === "string" ? { client_id: clientId } : {}),
  };
}

export function buildCreateBookingJson(params: {
  hallId: string;
  eventTypeId: string;
  packageId: string | null;
  clientId: string | null;
  clientName: string;
  clientPhone: string;
  clientPhone2: string;
  clientEmail: string;
  eventDate: string;
  shift: ShiftEnum | string;
  totalAmount: number | null;
  guestCount: number | null;
  status: BookingStatus | string;
  source: BookingSource | string;
  assignedTo: string;
  notes: string;
  holdExpiresAt: string | null;
}): Json {
  const { start_time, end_time } = shiftTimeWindow(params.shift as ShiftEnum);

  const holdIso =
    params.status === "on_hold" && params.holdExpiresAt
      ? `${params.holdExpiresAt}T23:59:59.000Z`
      : null;

  const total =
    params.totalAmount !== null && !Number.isNaN(params.totalAmount)
      ? params.totalAmount
      : null;

  const guests =
    params.guestCount !== null && !Number.isNaN(params.guestCount)
      ? params.guestCount
      : null;

  const phone2 = params.clientPhone2.trim() || null;

  const payload: Record<string, unknown> = {
    hall_id: params.hallId,
    event_type_id: params.eventTypeId,
    ...(params.packageId ? { package_id: params.packageId } : {}),
    ...(params.clientId ? { client_id: params.clientId } : {}),
    client_name: params.clientName.trim(),
    client_phone: params.clientPhone.trim(),
    client_phone2: phone2,
    client_phone_2: phone2,
    client_email: params.clientEmail.trim() || null,
    client_notes: null,
    event_date: params.eventDate,
    shift: params.shift as string,
    slot_id: null,
    start_time,
    end_time,
    status: params.status as string,
    source: params.source as string,
    total_amount: total,
    guest_count: guests,
    assigned_to: params.assignedTo.trim() || null,
    notes: params.notes.trim() || null,
    hold_expires_at: holdIso,
  };

  return payload as Json;
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (booking_data: Json) => {
      const supabase = createClient();
      /** Must match SQL: `create_booking(p_data jsonb)`. */
      const response = await supabase.rpc("create_booking", { p_data: booking_data });
      const raw = unwrapMutation<Json>(
        response as { data: Json | null; error: PostgrestError | null },
        "create booking"
      );
      return parseCreateBookingRpcResult(raw);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.clientsRoot });
    },
    onError: (e) => showMutationError(e),
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      bookingId: string;
      reason: CancellationReason;
      notes?: string;
    }) => {
      const supabase = createClient();
      const response = await supabase.rpc("cancel_booking", {
        p_booking_id: input.bookingId,
        p_reason: input.reason,
        p_notes: input.notes ?? null,
      });
      return unwrapMutation(
        response as {
          data: { success: boolean; outstanding_egp: number } | null;
          error: PostgrestError | null;
        },
        "cancel booking"
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e) => showMutationError(e),
  });
}

export function useBookingEditHistory(bookingId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.bookingEditHistory(bookingId ?? "__none__"),
    enabled: !!bookingId,
    queryFn: async (): Promise<BookingEditHistory[]> => {
      const supabase = createClient();
      const response = await supabase
        .from("booking_edit_history")
        .select("*")
        .eq("booking_id", bookingId as string)
        .order("created_at", { ascending: false });
      const rows = unwrapQuery<BookingEditHistory[] | null>(
        response as {
          data: BookingEditHistory[] | null;
          error: PostgrestError | null;
        },
        null,
        "booking edit history"
      );
      return rows ?? [];
    },
  });
}

/** Snapshot consumed by {@link buildEditBookingRpcChanges} + {@link useEditBooking}. */
export type EditBookingFormSnapshot = {
  hallId: string;
  eventDate: string;
  shift: ShiftEnum;
  /** Raw `<Select>` value; `""` or `__none__` clears package (when changed). */
  packageIdRaw: string;
  totalAmountNum: number | null;
  guestCountNum: number | null;
  notes: string;
  assignedTo: string;
};

export function normPackageId(raw: string | null | undefined): string | null {
  const x = raw?.trim() ?? "";
  if (!x || x === "__none__") return null;
  return x;
}

/** Build RPC `p_changes` only for fields that differ from the persisted booking row. */
export function buildEditBookingRpcChanges(args: {
  booking: Booking;
  form: EditBookingFormSnapshot;
}): Json {
  const b = args.booking;
  const f = args.form;
  const out: Record<string, unknown> = {};

  const nextPkg = normPackageId(f.packageIdRaw);
  const prevPkg = b.package_id ?? null;
  if ((nextPkg ?? null) !== (prevPkg ?? null)) {
    out.package_id = nextPkg;
  }

  if (f.hallId !== b.hall_id) {
    out.hall_id = f.hallId;
  }

  if (f.eventDate !== b.event_date) {
    out.event_date = f.eventDate;
  }

  const prevShift = b.shift ?? null;
  if (f.shift !== prevShift) {
    out.shift = f.shift;
  }

  const prevTotal = b.total_amount ?? null;
  if (
    (f.totalAmountNum ?? null) !== prevTotal &&
    f.totalAmountNum !== null
  ) {
    out.total_amount = f.totalAmountNum;
  }

  const prevGuests = b.guest_count ?? null;
  if (
    (f.guestCountNum ?? null) !== prevGuests &&
    f.guestCountNum !== null
  ) {
    out.guest_count = f.guestCountNum;
  }

  const prevNotes = b.notes ?? "";
  const nextNotes = f.notes ?? "";
  if (nextNotes !== prevNotes) {
    out.notes = nextNotes;
  }

  const prevAssigned = (b.assigned_to ?? "").trim();
  const nextAssigned = (f.assignedTo ?? "").trim();
  if (nextAssigned !== prevAssigned && nextAssigned.length > 0) {
    out.assigned_to = nextAssigned;
  }

  return out as Json;
}

export function bookingEditRpcHasChanges(changes: Json): boolean {
  return (
    typeof changes === "object" &&
    changes !== null &&
    !Array.isArray(changes) &&
    Object.keys(changes as Record<string, unknown>).length > 0
  );
}

export function useEditBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      booking: Booking;
      form: EditBookingFormSnapshot;
      financial_resolution: Json | null;
      agent_notes: string | null;
    }) => {
      const changes = buildEditBookingRpcChanges({
        booking: input.booking,
        form: input.form,
      });
      if (!bookingEditRpcHasChanges(changes)) {
        throw new Error("No changes to save");
      }

      const supabase = createClient();
      const response = await supabase.rpc("edit_booking", {
        p_booking_id: input.booking.id,
        p_changes: changes,
        p_financial_resolution: input.financial_resolution,
        p_agent_notes: input.agent_notes,
        p_override_cutoff: false,
      });
      return unwrapMutation<Json>(
        response as { data: Json | null; error: PostgrestError | null },
        "edit booking"
      );
    },
    onSuccess: (_, vars) => {
      const id = vars.booking.id;
      queryClient.invalidateQueries({ queryKey: queryKeys.booking(id) });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookingEditHistory(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.payments(id) });
    },
    onError: (e) => showMutationError(e),
  });
}
