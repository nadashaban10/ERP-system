"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toaster";
import { useCreateClient } from "@/lib/queries/clients";

const emptyForm = {
  name: "",
  phone_1: "",
  phone_2: "",
  email: "",
  notes: "",
};

interface NewClientDialogProps {
  venueId: string | null;
  open: boolean;
  onClose: () => void;
}

export function NewClientDialog({ venueId, open, onClose }: NewClientDialogProps) {
  const t = useTranslations("clients");
  const tc = useTranslations("common");
  const createClientMutation = useCreateClient();
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (open) setForm(emptyForm);
  }, [open]);

  async function handleSubmit() {
    if (!venueId) return;
    try {
      await createClientMutation.mutateAsync({
        venue_id: venueId,
        name: form.name,
        phone_1: form.phone_1,
        phone_2: form.phone_2 || null,
        email: form.email || null,
        notes: form.notes || null,
      });
      toast({ variant: "success", title: t("clientCreatedToast") });
      setForm(emptyForm);
      onClose();
    } catch {
      /* useCreateClient already toasts mutation errors */
    }
  }

  const isBusy = createClientMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("new")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {!venueId && (
            <p className="text-sm text-amber-800">{t("noVenueHint")}</p>
          )}
          <div className="space-y-1.5">
            <Label>{t("fullNameLabel")}</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder={t("fullNamePlaceholder")}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("primaryPhoneLabel")}</Label>
              <Input
                value={form.phone_1}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone_1: e.target.value }))
                }
                placeholder={t("primaryPhonePlaceholder")}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("secondaryPhoneLabel")}</Label>
              <Input
                value={form.phone_2}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone_2: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{t("email")}</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("notesLabel")}</Label>
            <Textarea
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onClose()} disabled={isBusy}>
            {tc("cancel")}
          </Button>
          <Button
            onClick={() => void handleSubmit()}
            disabled={
              isBusy ||
              !venueId ||
              !form.name.trim() ||
              !form.phone_1.trim()
            }
          >
            {isBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("addClient")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
