import type { Booking } from "@/lib/types/database";
import type { AssignableAgent } from "@/lib/queries/assignable-agents";

/**
 * Human-readable assignee for UI. Uses `assigned_agent_id` + agent directory when available,
 * otherwise falls back to legacy free-text `assigned_to`.
 */
export function bookingAssignedDisplay(
  booking: Pick<Booking, "assigned_agent_id" | "assigned_to">,
  agents: AssignableAgent[]
): string {
  const id = booking.assigned_agent_id?.trim();
  if (id) {
    const row = agents.find((a) => a.id === id);
    if (row?.full_name?.trim()) return row.full_name.trim();
    if (row?.email) return row.email;
  }
  const legacy = booking.assigned_to?.trim();
  if (legacy) return legacy;
  return "—";
}
