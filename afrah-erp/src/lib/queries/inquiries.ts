"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMyProfile } from "@/lib/auth/use-my-profile";
import type { PostgrestError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type {
  Client,
  Database,
  Inquiry,
  InquirySource,
  InquiryStatus,
  BookingSource,
  Json,
} from "@/lib/types/database";
import {
  showMutationError,
  unwrapMutation,
  unwrapQuery,
} from "@/lib/queries/helpers";
import {
  agentWorkloadCacheKey,
  applyAgentWorkloadFilter,
} from "@/lib/queries/agent-scope";
import { queryKeys } from "@/lib/queries/keys";
import { parseCreateBookingRpcResult } from "@/lib/queries/bookings";

type InquiryInsert = Database["public"]["Tables"]["inquiries"]["Insert"];

const INQUIRY_DETAIL_SELECT = "*,clients(*)";

type InquiryJoinRow = Inquiry & {
  clients: Client | null;
};

export function normalizeInquiryJoinRow(row: InquiryJoinRow): Inquiry {
  const { clients, ...rest } = row;
  return {
    ...rest,
    client: clients ?? undefined,
  };
}

export type InquiriesListFilters = {
  status: string;
};

export function useInquiriesList(filters: InquiriesListFilters) {
  const { data: profile } = useMyProfile();
  const agentKey = agentWorkloadCacheKey(profile);

  return useQuery({
    queryKey: queryKeys.inquiries({ scope: "list", status: filters.status, agentScope: agentKey }),
    queryFn: async (): Promise<Inquiry[]> => {
      const supabase = createClient();
      let q = supabase
        .from("inquiries")
        .select(INQUIRY_DETAIL_SELECT)
        .order("created_at", { ascending: false });

      if (filters.status !== "all") {
        q = q.eq("status", filters.status as InquiryStatus);
      }

      q = applyAgentWorkloadFilter(q, profile);

      const response = await q;
      const rows = unwrapQuery<InquiryJoinRow[]>(response, [], "inquiries list");
      return rows.map(normalizeInquiryJoinRow);
    },
  });
}

export function useInquiryDetail(id: string | null | undefined) {
  const { data: profile } = useMyProfile();
  const agentKey = agentWorkloadCacheKey(profile);

  return useQuery({
    queryKey: [...queryKeys.inquiry(id ?? "__none__"), agentKey] as const,
    enabled: !!id,
    queryFn: async (): Promise<Inquiry | null> => {
      const supabase = createClient();
      let q = supabase
        .from("inquiries")
        .select(INQUIRY_DETAIL_SELECT)
        .eq("id", id as string);
      q = applyAgentWorkloadFilter(q, profile);
      const response = await q.maybeSingle();
      const row = unwrapQuery<InquiryJoinRow | null>(response, null, "inquiry detail");
      return row ? normalizeInquiryJoinRow(row) : null;
    },
  });
}

export type CreateInquiryInput = {
  venue_id: string;
  client_id: string;
  desired_date: string | null;
  guest_count: number | null;
  package_interest: string | null;
  source: InquirySource;
  notes: string | null;
};

/** Context passed into `BookingWizard` when converting an inquiry via `convert_inquiry_to_booking`. */
export type InquiryBookingConversionContext = {
  inquiryId: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientPhone2: string;
  clientEmail: string;
  desiredDate: string | null;
  guestCount: number | null;
  inquiryNotes: string | null;
  bookingSource: BookingSource;
};

function mapInquirySourceToBookingSource(source: Inquiry["source"]): BookingSource {
  if (source === "walk_in") return "walk_in";
  if (source === "phone") return "phone";
  return "phone";
}

export function inquiryToBookingConversionContext(
  inquiry: Inquiry
): InquiryBookingConversionContext {
  const c = inquiry.client;
  return {
    inquiryId: inquiry.id,
    clientId: inquiry.client_id,
    clientName: c?.name ?? "",
    clientPhone: c?.phone_1 ?? "",
    clientPhone2: c?.phone_2 ?? "",
    clientEmail: c?.email ?? "",
    desiredDate: inquiry.desired_date,
    guestCount: inquiry.guest_count,
    inquiryNotes: inquiry.notes,
    bookingSource: mapInquirySourceToBookingSource(inquiry.source),
  };
}

export function useConvertInquiryToBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { inquiryId: string; booking_data: Json }) => {
      const supabase = createClient();
      const response = await supabase.rpc("convert_inquiry_to_booking", {
        p_inquiry_id: input.inquiryId,
        p_booking_data: input.booking_data,
      });
      const raw = unwrapMutation<Json>(
        response as { data: Json | null; error: PostgrestError | null },
        "convert inquiry to booking"
      );
      return parseCreateBookingRpcResult(raw);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.clientsRoot });
      queryClient.invalidateQueries({ queryKey: ["inquiries"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.inquiry(variables.inquiryId) });
    },
    onError: (e) => showMutationError(e),
  });
}

export function useCreateInquiry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateInquiryInput) => {
      const supabase = createClient();
      const row: InquiryInsert = {
        venue_id: input.venue_id,
        client_id: input.client_id,
        desired_date: input.desired_date,
        alt_date: null,
        guest_count: input.guest_count,
        package_interest: input.package_interest,
        source: input.source,
        notes: input.notes,
        status: "new",
        pending_reason: null,
        pending_notes: null,
        cancellation_reason: null,
        last_attempt_at: null,
        booking_id: null,
        follow_up_date: null,
        assigned_agent_id: null,
      };
      const response = await supabase.from("inquiries").insert(row).select().single();
      return unwrapMutation<Inquiry>(
        response as {
          data: Inquiry | null;
          error: PostgrestError | null;
        },
        "create inquiry"
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inquiries"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e) => showMutationError(e),
  });
}
