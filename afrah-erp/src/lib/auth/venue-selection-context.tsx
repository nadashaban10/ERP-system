"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMyProfile } from "@/lib/auth/use-my-profile";
import type { ProfileVenue } from "@/lib/auth/my-profile";

export type VenueSelectionContextValue = {
  /** From profile; first item is the default active venue. */
  profileVenues: ProfileVenue[];
  selectedVenueId: string | null;
  setSelectedVenueId: (id: string) => void;
  /** `null` = “All halls” (URL `hall` absent or `all`). */
  selectedHallId: string | null;
  setSelectedHallId: (id: string | null) => void;
  /** Owner with multiple venues, or super admin with multiple — not shown for agents. */
  showVenuePicker: boolean;
};

const VenueSelectionContext = createContext<VenueSelectionContextValue | null>(null);

function InnerProvider({ children }: { children: ReactNode }) {
  const { data: profile, isSuccess } = useMyProfile();
  const venues = profile?.venues ?? [];
  const role = profile?.role ?? "";
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [selectedVenueId, setSelectedVenueIdState] = useState<string | null>(null);

  useEffect(() => {
    if (!isSuccess || venues.length === 0) return;
    setSelectedVenueIdState((prev) => {
      if (prev && venues.some((v) => v.id === prev)) return prev;
      return venues[0]?.id ?? null;
    });
  }, [isSuccess, venues]);

  const hallParam = searchParams.get("hall");
  const selectedHallId =
    !hallParam || hallParam === "all" || hallParam.length === 0 ? null : hallParam;

  const setSelectedHallId = useCallback(
    (hallId: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (!hallId) {
        params.delete("hall");
      } else {
        params.set("hall", hallId);
      }
      const q = params.toString();
      router.replace(q ? `${pathname}?${q}` : pathname);
    },
    [pathname, router, searchParams]
  );

  const setSelectedVenueId = useCallback(
    (id: string) => {
      setSelectedVenueIdState(id);
      const params = new URLSearchParams(searchParams.toString());
      params.delete("hall");
      const q = params.toString();
      router.replace(q ? `${pathname}?${q}` : pathname);
    },
    [pathname, router, searchParams]
  );

  const showVenuePicker =
    venues.length > 1 && (role === "owner" || role === "super_admin");

  const value = useMemo<VenueSelectionContextValue>(
    () => ({
      profileVenues: venues,
      selectedVenueId,
      setSelectedVenueId,
      selectedHallId,
      setSelectedHallId,
      showVenuePicker,
    }),
    [
      venues,
      selectedVenueId,
      setSelectedVenueId,
      selectedHallId,
      setSelectedHallId,
      showVenuePicker,
    ]
  );

  return (
    <VenueSelectionContext.Provider value={value}>{children}</VenueSelectionContext.Provider>
  );
}

/** Requires Suspense boundary when using `useSearchParams`. */
export function VenueSelectionProvider({ children }: { children: ReactNode }) {
  return <InnerProvider>{children}</InnerProvider>;
}

export function useVenueSelection(): VenueSelectionContextValue {
  const ctx = useContext(VenueSelectionContext);
  if (!ctx) {
    throw new Error("useVenueSelection must be used within VenueSelectionProvider");
  }
  return ctx;
}
