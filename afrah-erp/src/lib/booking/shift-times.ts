import type { ShiftEnum } from "@/lib/types/database";

/**
 * Default clock windows used for overlap checks vs. `bookings.shift` (`ShiftEnum`).
 * The booking wizard resolves `event_type_id` separately from these intervals.
 */
export function shiftTimeWindow(shift: ShiftEnum | string): {
  start_time: string;
  end_time: string;
} {
  switch (shift) {
    case "morning":
      return { start_time: "09:00", end_time: "15:00" };
    case "evening":
      return { start_time: "18:00", end_time: "23:59" };
    case "full_day":
      return { start_time: "09:00", end_time: "23:59" };
    default:
      return { start_time: "12:00", end_time: "15:00" };
  }
}
