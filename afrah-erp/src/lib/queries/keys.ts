/**
 * Centralized React Query key factory.
 *
 * Why: keep all cache keys in one place so invalidation stays correct as
 * the app grows. Each module adds a sub-namespace here.
 */

export const queryKeys = {
  // Auth / profile
  myProfile: ["myProfile"] as const,

  // Module 1 — Venue settings
  venue: ["venue"] as const,
  halls: ["halls"] as const,
  hall: (id: string) => ["halls", id] as const,
  packages: ["packages"] as const,
  package: (id: string) => ["packages", id] as const,
  eventTypes: (hallId: string) => ["eventTypes", hallId] as const,

  // Module 2 — Dashboard
  dashboardSummary: (hallId: string | null) =>
    ["dashboard", "summary", hallId ?? "all"] as const,

  // Module 3 — Clients
  clientsRoot: ["clients"] as const,
  clientsForVenue: (venueId: string) =>
    ["clients", "list", venueId] as const,
  clientBookingSummaries: (venueId: string) =>
    ["clients", "bookingSummaries", venueId] as const,
  client: (id: string) => ["clients", "detail", id] as const,

  // Module 4 — Calendar
  calendarBookings: (range: { from: string; to: string; hallId: string | null }) =>
    [
      "calendar",
      "bookings",
      range.from,
      range.to,
      range.hallId ?? "all",
    ] as const,

  // Module 5 — Bookings
  bookings: (filters: Record<string, unknown> = {}) =>
    ["bookings", filters] as const,
  booking: (id: string) => ["bookings", id] as const,

  // Module 6 — Payments
  payments: (bookingId: string) => ["payments", bookingId] as const,

  bookingEditHistory: (bookingId: string) =>
    ["bookings", bookingId, "editHistory"] as const,

  // Module 7 — Inquiries
  inquiries: (filters: Record<string, unknown> = {}) =>
    ["inquiries", filters] as const,
  inquiry: (id: string) => ["inquiries", id] as const,
  inquiryReminders: (inquiryId: string) =>
    ["inquiries", inquiryId, "reminders"] as const,

  // Module 8 — Notifications
  notifications: (userId: string) => ["notifications", userId] as const,

  // Module 9 — Users
  agents: (ownerId: string) => ["agents", ownerId] as const,
  venueUsersList: ["venueUsers", "list"] as const,

  // Module 10 — Super admin
  platformDashboard: ["platformDashboard"] as const,
  allVenues: (filters: Record<string, unknown> = {}) =>
    ["allVenues", filters] as const,
  auditLog: (venueId: string | null) =>
    ["auditLog", venueId ?? "all"] as const,
} as const;
