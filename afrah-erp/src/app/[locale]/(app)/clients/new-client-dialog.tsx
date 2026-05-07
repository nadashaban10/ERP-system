"use client";

import { useState } from "react";
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

interface NewClientDialogProps {
  open: boolean;
  onClose: () => void;
}

export function NewClientDialog({ open, onClose }: NewClientDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone_1: "",
    phone_2: "",
    email: "",
    notes: "",
  });

  async function handleSubmit() {
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 700));
    // TODO: supabase.from("clients").insert(...)
    toast({ variant: "success", title: "Client added" });
    setIsSubmitting(false);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Client</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Full Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Client full name"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Primary Phone *</Label>
              <Input
                value={form.phone_1}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone_1: e.target.value }))
                }
                placeholder="01xxxxxxxxx"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Secondary Phone</Label>
              <Input
                value={form.phone_2}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone_2: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
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
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !form.name || !form.phone_1}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Client
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
