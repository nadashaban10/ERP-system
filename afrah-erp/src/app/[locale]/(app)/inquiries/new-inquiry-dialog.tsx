"use client";

import { useState } from "react";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { MOCK_CLIENTS } from "@/lib/mock-data";
import { toast } from "@/components/ui/toaster";

interface NewInquiryDialogProps {
  open: boolean;
  onClose: () => void;
}

export function NewInquiryDialog({ open, onClose }: NewInquiryDialogProps) {
  const t = useTranslations("inquiries");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<{
    clientId: string;
    clientName: string;
    clientPhone: string;
    desiredDate: string;
    guestCount: string;
    packageInterest: string;
    source: "phone" | "walk_in" | "whatsapp" | "instagram" | "other";
    notes: string;
  }>({
    clientId: "",
    clientName: "",
    clientPhone: "",
    desiredDate: "",
    guestCount: "",
    packageInterest: "",
    source: "phone",
    notes: "",
  });

  async function handleSubmit() {
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 700));
    // TODO: supabase.from("inquiries").insert(...)
    toast({ variant: "success", title: "Inquiry created" });
    setIsSubmitting(false);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("new")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Client Name</Label>
              <Input
                value={form.clientName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, clientName: e.target.value }))
                }
                placeholder="Full name"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input
                value={form.clientPhone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, clientPhone: e.target.value }))
                }
                placeholder="01xxxxxxxxx"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Desired Date</Label>
              <Input
                type="date"
                value={form.desiredDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, desiredDate: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Guest Count</Label>
              <Input
                type="number"
                value={form.guestCount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, guestCount: e.target.value }))
                }
                placeholder="~200"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Source</Label>
              <Select
                value={form.source}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, source: v as typeof f.source }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="walk_in">Walk-in</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Package Interest</Label>
              <Input
                value={form.packageInterest}
                onChange={(e) =>
                  setForm((f) => ({ ...f, packageInterest: e.target.value }))
                }
                placeholder="e.g. Gold Package"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !form.clientName}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Inquiry
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
