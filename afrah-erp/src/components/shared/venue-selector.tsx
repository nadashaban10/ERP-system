"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2 } from "lucide-react";
import { useVenueSelection } from "@/lib/auth/venue-selection-context";

/** Owner / super_admin with multiple venues — switches active venue context (topbar). */
export function VenueSelector() {
  const {
    profileVenues,
    selectedVenueId,
    setSelectedVenueId,
    showVenuePicker,
  } = useVenueSelection();

  if (!showVenuePicker || profileVenues.length === 0) return null;

  return (
    <Select value={selectedVenueId ?? undefined} onValueChange={setSelectedVenueId}>
      <SelectTrigger className="min-w-[180px] max-w-[240px] gap-2">
        <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
        <SelectValue placeholder="Venue" />
      </SelectTrigger>
      <SelectContent>
        {profileVenues.map((v) => (
          <SelectItem key={v.id} value={v.id}>
            {v.name_en}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
