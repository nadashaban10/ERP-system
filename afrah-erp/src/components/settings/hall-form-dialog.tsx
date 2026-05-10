"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toaster";
import { useCreateHall, useUpdateHall, type HallWithEventTypes } from "@/lib/queries/halls";
import { showMutationError } from "@/lib/queries/helpers";

interface HallFormDialogProps {
  open: boolean;
  onClose: () => void;
  /** Provided when editing; omit when creating. */
  hall?: HallWithEventTypes | null;
  venueId: string;
}

type FormState = {
  name: string;
  capacity_min: string;
  capacity_max: string;
  amenities: string[];
};

const EMPTY: FormState = {
  name: "",
  capacity_min: "",
  capacity_max: "",
  amenities: [],
};

export function HallFormDialog({ open, onClose, hall, venueId }: HallFormDialogProps) {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const isEdit = !!hall;

  const [form, setForm] = useState<FormState>(EMPTY);
  const [amenityDraft, setAmenityDraft] = useState("");

  const createHall = useCreateHall();
  const updateHall = useUpdateHall();
  const isSaving = createHall.isPending || updateHall.isPending;

  // Reset / hydrate the form whenever the dialog (re)opens or the target hall changes.
  useEffect(() => {
    if (!open) return;
    if (hall) {
      setForm({
        name: hall.name,
        capacity_min: hall.capacity_min?.toString() ?? "",
        capacity_max: hall.capacity_max?.toString() ?? "",
        amenities: [...hall.amenities],
      });
    } else {
      setForm(EMPTY);
    }
    setAmenityDraft("");
  }, [open, hall]);

  function addAmenity() {
    const value = amenityDraft.trim();
    if (!value || form.amenities.includes(value)) return;
    setForm((f) => ({ ...f, amenities: [...f.amenities, value] }));
    setAmenityDraft("");
  }

  function removeAmenity(value: string) {
    setForm((f) => ({ ...f, amenities: f.amenities.filter((a) => a !== value) }));
  }

  async function handleSubmit() {
    const capacityMax = parseInt(form.capacity_max, 10);
    if (!form.name.trim() || Number.isNaN(capacityMax) || capacityMax <= 0) {
      toast({
        variant: "destructive",
        title: t("hallFormError") || "Please fill in name and a valid maximum capacity",
      });
      return;
    }

    const capacityMin = form.capacity_min.trim()
      ? parseInt(form.capacity_min, 10)
      : null;

    try {
      if (isEdit && hall) {
        await updateHall.mutateAsync({
          id: hall.id,
          changes: {
            name: form.name.trim(),
            capacity_min: capacityMin,
            capacity_max: capacityMax,
            amenities: form.amenities,
          },
        });
        toast({ variant: "success", title: t("hallUpdated") || "Hall updated" });
      } else {
        await createHall.mutateAsync({
          venue_id: venueId,
          name: form.name.trim(),
          capacity_min: capacityMin,
          capacity_max: capacityMax,
          amenities: form.amenities,
        });
        toast({ variant: "success", title: t("hallCreated") || "Hall added" });
      }
      onClose();
    } catch (error) {
      showMutationError(error, isEdit ? "Update failed" : "Create failed");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("editHall") || "Edit Hall" : t("addHall")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>
              {t("hallName")} <span className="text-destructive">*</span>
            </Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Crystal Ballroom"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("minCapacity") || "Min capacity"}</Label>
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                value={form.capacity_min}
                onChange={(e) =>
                  setForm((f) => ({ ...f, capacity_min: e.target.value }))
                }
                placeholder="—"
              />
            </div>
            <div className="space-y-1.5">
              <Label>
                {t("capacity")} <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                value={form.capacity_max}
                onChange={(e) =>
                  setForm((f) => ({ ...f, capacity_max: e.target.value }))
                }
                placeholder="500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{t("amenities")}</Label>
            <div className="flex gap-2">
              <Input
                value={amenityDraft}
                onChange={(e) => setAmenityDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addAmenity();
                  }
                }}
                placeholder={t("amenityPlaceholder") || "AC, Parking, Stage…"}
              />
              <Button
                type="button"
                variant="outline"
                onClick={addAmenity}
                disabled={!amenityDraft.trim()}
              >
                {t("add") || "Add"}
              </Button>
            </div>
            {form.amenities.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {form.amenities.map((amenity) => (
                  <span
                    key={amenity}
                    className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-foreground"
                  >
                    {amenity}
                    <button
                      type="button"
                      onClick={() => removeAmenity(amenity)}
                      className="rounded-full p-0.5 text-muted-foreground hover:bg-background hover:text-foreground"
                      aria-label={`Remove ${amenity}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            {tCommon("cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? tCommon("save") : t("addHall")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
