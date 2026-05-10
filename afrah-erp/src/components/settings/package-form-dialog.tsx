"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toaster";
import {
  useCreatePackage,
  useUpdatePackage,
} from "@/lib/queries/packages";
import { showMutationError } from "@/lib/queries/helpers";
import type { Package } from "@/lib/types/database";

interface PackageFormDialogProps {
  open: boolean;
  onClose: () => void;
  /** Provided when editing; omit when creating. */
  pkg?: Package | null;
  venueId: string;
}

type FormState = {
  name: string;
  price_type: Package["price_type"];
  base_price: string;
  min_guests: string;
  inclusions: string;
};

const EMPTY: FormState = {
  name: "",
  price_type: "flat_rate",
  base_price: "",
  min_guests: "",
  inclusions: "",
};

export function PackageFormDialog({
  open,
  onClose,
  pkg,
  venueId,
}: PackageFormDialogProps) {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const isEdit = !!pkg;

  const [form, setForm] = useState<FormState>(EMPTY);

  const createPkg = useCreatePackage();
  const updatePkg = useUpdatePackage();
  const isSaving = createPkg.isPending || updatePkg.isPending;

  useEffect(() => {
    if (!open) return;
    if (pkg) {
      setForm({
        name: pkg.name,
        price_type: pkg.price_type,
        base_price: pkg.base_price.toString(),
        min_guests: pkg.min_guests?.toString() ?? "",
        inclusions: pkg.inclusions ?? "",
      });
    } else {
      setForm(EMPTY);
    }
  }, [open, pkg]);

  async function handleSubmit() {
    const basePrice = parseFloat(form.base_price);
    if (!form.name.trim() || Number.isNaN(basePrice) || basePrice <= 0) {
      toast({
        variant: "destructive",
        title:
          t("packageFormError") ||
          "Please fill in name and a valid base price",
      });
      return;
    }

    const minGuests = form.min_guests.trim()
      ? parseInt(form.min_guests, 10)
      : null;

    try {
      if (isEdit && pkg) {
        await updatePkg.mutateAsync({
          id: pkg.id,
          changes: {
            name: form.name.trim(),
            price_type: form.price_type,
            base_price: basePrice,
            min_guests: minGuests,
            inclusions: form.inclusions.trim() || null,
          },
        });
        toast({
          variant: "success",
          title: t("packageUpdated") || "Package updated",
        });
      } else {
        await createPkg.mutateAsync({
          venue_id: venueId,
          name: form.name.trim(),
          price_type: form.price_type,
          base_price: basePrice,
          min_guests: minGuests,
          inclusions: form.inclusions.trim() || null,
        });
        toast({
          variant: "success",
          title: t("packageCreated") || "Package added",
        });
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
            {isEdit ? t("editPackage") || "Edit Package" : t("addPackage")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>
              {t("packageName")} <span className="text-destructive">*</span>
            </Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Silver Package"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("priceType")}</Label>
              <Select
                value={form.price_type}
                onValueChange={(v: Package["price_type"]) =>
                  setForm((f) => ({ ...f, price_type: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flat_rate">{t("flatRate")}</SelectItem>
                  <SelectItem value="per_person">{t("perPerson")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>
                {t("basePrice")} <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                inputMode="decimal"
                min={1}
                value={form.base_price}
                onChange={(e) =>
                  setForm((f) => ({ ...f, base_price: e.target.value }))
                }
                placeholder="1500"
              />
            </div>
          </div>

          {form.price_type === "per_person" && (
            <div className="space-y-1.5">
              <Label>{t("minGuests") || "Minimum guests"}</Label>
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                value={form.min_guests}
                onChange={(e) =>
                  setForm((f) => ({ ...f, min_guests: e.target.value }))
                }
                placeholder="100"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label>{t("inclusions") || "Inclusions"}</Label>
            <Textarea
              value={form.inclusions}
              onChange={(e) =>
                setForm((f) => ({ ...f, inclusions: e.target.value }))
              }
              rows={3}
              placeholder={
                t("inclusionsPlaceholder") ||
                "Hall rental, catering, decorations, DJ…"
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            {tCommon("cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? tCommon("save") : t("addPackage")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
