"use client";

import { useQuery } from "@tanstack/react-query";
import { useMyProfile } from "@/lib/auth/use-my-profile";
import type { BookingStatus, Inquiry, ShiftEnum } from "@/lib/types/database";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/queries/keys";
import { unwrapQuery } from "@/lib/queries/helpers";
import {
  agentWorkloadCacheKey,
  applyAgentWorkloadFilter,
} from "@/lib/queries/agent-scope";

/** Normalized shape consumed by dashboard UI after parsing `get_dashboard_summary` JSON. */
export interface DashboardTodayBooking {
  id: string;
  start_time: string;
  status: BookingStatus | string;
  client?: { name: string };
  hall?: { name: string };
}

export interface DashboardExpiringHold {
  id: string;
  client?: { name: string };
  hold_expires_at?: string | null;
}

export interface ParsedDashboardSummary {
  today_bookings: DashboardTodayBooking[];
  week_count: number;
  outstanding_egp: number;
  overdue_followups_count: number;
  expiring_holds: DashboardExpiringHold[];
}

const EMPTY_SUMMARY: ParsedDashboardSummary = {
  today_bookings: [],
  week_count: 0,
  outstanding_egp: 0,
  overdue_followups_count: 0,
  expiring_holds: [],
};

function num(v: unknown): number {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string") {
    const x = parseFloat(v);
    return Number.isNaN(x) ? 0 : x;
  }
  return 0;
}

/** Parses Supabase JSON from `get_dashboard_summary` per SUPABASE_SETUP.md 8.13. */
export function parseDashboardRpc(data: unknown): ParsedDashboardSummary {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return EMPTY_SUMMARY;
  }
  const o = data as Record<string, unknown>;

  const mapToday = (row: unknown): DashboardTodayBooking => {
    if (!row || typeof row !== "object") {
      return { id: "", start_time: "", status: "" };
    }
    const r = row as Record<string, unknown>;
    return {
      id: String(r.id ?? ""),
      start_time:
        typeof r.start_time === "string"
          ? r.start_time.slice(0, 5)
          : String(r.start_time ?? ""),
      status: String(r.status ?? ""),
      client: r.client_name
        ? { name: String(r.client_name) }
        : undefined,
      hall: r.hall_name ? { name: String(r.hall_name) } : undefined,
    };
  };

  const mapHold = (row: unknown): DashboardExpiringHold => {
    if (!row || typeof row !== "object") {
      return { id: "" };
    }
    const r = row as Record<string, unknown>;
    return {
      id: String(r.id ?? ""),
      client: r.client_name ? { name: String(r.client_name) } : undefined,
      hold_expires_at:
        typeof r.hold_expires_at === "string"
          ? r.hold_expires_at
          : undefined,
    };
  };

  const todayRaw = o.today_bookings;
  const today_bookings = Array.isArray(todayRaw)
    ? todayRaw.map(mapToday).filter((b) => b.id)
    : [];

  const holdsRaw = o.expiring_holds;
  const expiring_holds = Array.isArray(holdsRaw)
    ? holdsRaw.map(mapHold).filter((h) => h.id)
    : [];

  return {
    today_bookings,
    week_count: num(o.week_count),
    outstanding_egp: num(o.outstanding_egp),
    overdue_followups_count: num(o.overdue_followups_count),
    expiring_holds,
  };
}

export function useDashboardSummary(hallId: string | null) {
  return useQuery({
    queryKey: queryKeys.dashboardSummary(hallId),
    queryFn: async (): Promise<ParsedDashboardSummary> => {
      const supabase = createClient();
      const response = await supabase.rpc("get_dashboard_summary", {
        p_hall_id: hallId,
      });

      const data = unwrapQuery(response, null, "get_dashboard_summary");
      return parseDashboardRpc(data);
    },
  });
}

/** Sidebar "recent bookings" list — separate from RPC aggregate. */
export interface DashboardRecentBooking {
  id: string;
  event_date: string;
  shift: ShiftEnum | string | null;
  status: BookingStatus | string;
  total_amount: number | null;
  amount_outstanding: number | string | null;
  clients: { name: string } | null;
  halls: { name: string } | null;
}

export function useDashboardRecentBookings(hallId: string | null) {
  const { data: profile } = useMyProfile();
  const agentKey = agentWorkloadCacheKey(profile);

  return useQuery({
    queryKey: [...queryKeys.bookings({ scope: "dashboard-recent", hallId }), hallId, agentKey] as const,
    queryFn: async (): Promise<DashboardRecentBooking[]> => {
      const supabase = createClient();
      let q = supabase
        .from("bookings")
        .select(
          "id, event_date, shift, status, total_amount, amount_outstanding, clients(name), halls(name)"
        )
        .neq("status", "cancelled")
        .order("updated_at", { ascending: false })
        .limit(5);

      if (hallId) {
        q = q.eq("hall_id", hallId);
      }

      q = applyAgentWorkloadFilter(q, profile);

      const response = await q;
      return unwrapQuery(response, [], "dashboard recent bookings");
    },
  });
}

export interface DashboardOverdueInquiryRow {
  id: string;
  follow_up_date: string | null;
  no_response_count: number | null | undefined;
  status: Inquiry["status"];
  clients: { name: string } | null;
}

function todayUtcDateString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function useDashboardOverdueInquiries(enabled: boolean) {
  const today = todayUtcDateString();
  const { data: profile } = useMyProfile();
  const agentKey = agentWorkloadCacheKey(profile);

  return useQuery({
    queryKey: [...queryKeys.inquiries({ scope: "dashboard-overdue", today }), enabled, agentKey] as const,
    enabled,
    queryFn: async (): Promise<DashboardOverdueInquiryRow[]> => {
      const supabase = createClient();
      let q = supabase
        .from("inquiries")
        .select(
          "id, follow_up_date, no_response_count, status, clients(name)"
        )
        .lte("follow_up_date", today)
        .not("status", "in", '("converted","cancelled")')
        .order("follow_up_date", { ascending: true })
        .limit(4);

      q = applyAgentWorkloadFilter(q, profile);

      const response = await q;

      return unwrapQuery(response, [], "dashboard overdue inquiries");
    },
  });
}
