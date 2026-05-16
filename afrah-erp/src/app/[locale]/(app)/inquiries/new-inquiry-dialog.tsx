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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toaster";
import type { InquirySource } from "@/lib/types/database";
import { useVenue } from "@/lib/queries/venue";
import {
  useClientsForVenue,
  useCreateClient,
  type NewClientInput,
} from "@/lib/queries/clients";
import { useCreateInquiry } from "@/lib/queries/inquiries";
import { useMyProfile } from "@/lib/auth/use-my-profile";
import { useVenueAssignableAgents } from "@/lib/queries/assignable-agents";

const ASSIGN_AGENT_NONE = "__none__";

interface NewInquiryDialogProps {
  open: boolean;
  onClose: () => void;
}

type DialogMode = "existing" | "new";

export function NewInquiryDialog({ open, onClose }: NewInquiryDialogProps) {
  const t = useTranslations("inquiries");
  const tNd = useTranslations("inquiries.newDialog");
  const tc = useTranslations("common");

  const { data: profile } = useMyProfile();

  const venueQuery = useVenue();
  const venueId = venueQuery.data?.id ?? null;
  const venueRow = venueQuery.data;

  const clientsQuery = useClientsForVenue(open ? venueId : undefined);
  const clients = clientsQuery.data ?? [];

  const { data: venueAgents = [] } = useVenueAssignableAgents(
    open && venueId ? venueId : undefined,
    {
      enabled: open && !!venueId,
      venueOwnerUserId: venueRow?.owner_user_id ?? null,
    }
  );

  const createClient = useCreateClient();
  const createInquiry = useCreateInquiry();

  const [mode, setMode] = useState<DialogMode>("existing");
  const [clientId, setClientId] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [desiredDate, setDesiredDate] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [packageInterest, setPackageInterest] = useState("");
  const [source, setSource] = useState<InquirySource>("phone");
  const [notes, setNotes] = useState("");
  const [assignedAgentId, setAssignedAgentId] = useState("");

  const showAgentPicker = !!profile && profile.role !== "agent";

  useEffect(() => {
    if (!open) return;
    setMode("existing");
    setClientId("");
    setClientName("");
    setClientPhone("");
    setDesiredDate("");
    setGuestCount("");
    setPackageInterest("");
    setSource("phone");
    setNotes("");
    setAssignedAgentId("");
  }, [open]);

  const busy =
    createClient.isPending ||
    createInquiry.isPending ||
    clientsQuery.isPending;

  async function handleSubmit() {
    if (!profile) {
      toast({
        variant: "destructive",
        title: tNd("submitBlockedProfile"),
      });
      return;
    }

    if (!venueId) {
      toast({
        variant: "destructive",
        title: tNd("noVenue"),
      });
      return;
    }

    if (profile.role === "agent" && !profile.user_id) {
      toast({
        variant: "destructive",
        title: tNd("submitBlockedAgentId"),
      });
      return;
    }

    try {
      let resolvedClientId = clientId;
      if (mode === "new") {
        if (!clientName.trim() || !clientPhone.trim()) return;
        const payload: NewClientInput = {
          venue_id: venueId,
          name: clientName,
          phone_1: clientPhone,
          phone_2: null,
          email: null,
          notes: null,
        };
        const row = await createClient.mutateAsync(payload);
        resolvedClientId = row.id;
      } else if (!resolvedClientId) {
        return;
      }

      const gc = parseInt(guestCount, 10);

      const guest_count = Number.isNaN(gc) ? null : gc;
      const formAssignedAgentId =
        profile.role !== "agent" ? assignedAgentId.trim() || null : null;

      const values = {
        venue_id: venueId,
        client_id: resolvedClientId,
        desired_date: desiredDate || null,
        guest_count,
        package_interest: packageInterest.trim() || null,
        source,
        notes: notes.trim() || null,
        assigned_agent_id: formAssignedAgentId,
      };

      const assignedAgentIdFinal =
        profile.role === "agent" ? profile.user_id : values.assigned_agent_id || null;

      const payload = {
        ...values,
        assigned_agent_id: assignedAgentIdFinal,
      };

      console.log("current profile", profile);
      console.log("selected venue_id", venueId);
      console.log("form assigned_agent_id", values.assigned_agent_id);
      console.log("final inquiry payload", payload);

      await createInquiry.mutateAsync(payload);

      toast({ variant: "success", title: t("createdToast") });
      onClose();
    } catch {
      /* toasts handled on mutations */
    }
  }

  const canSubmit =
    mode === "existing"
      ? !!clientId
      : !!(clientName.trim() && clientPhone.trim());

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("new")}</DialogTitle>
        </DialogHeader>
        {!venueQuery.isPending && !venueId ? (
          <p className="text-sm text-amber-800">{tNd("noVenue")}</p>
        ) : venueQuery.isPending ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <Tabs
              value={mode}
              onValueChange={(v) => setMode(v as DialogMode)}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="existing">{tNd("existingTab")}</TabsTrigger>
                <TabsTrigger value="new">{tNd("newTab")}</TabsTrigger>
              </TabsList>
              <TabsContent value="existing" className="pt-4">
                <div className="space-y-1.5">
                  <Label>{t("client")}</Label>
                  <Select
                    value={clientId}
                    onValueChange={setClientId}
                    disabled={busy}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={tNd("selectClientPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} · {c.phone_1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
              <TabsContent value="new" className="pt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>{tNd("nameLabel")}</Label>
                    <Input
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      disabled={busy}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{tNd("phoneLabel")}</Label>
                    <Input
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      disabled={busy}
                      placeholder="01xxxxxxxxx"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {showAgentPicker && (
              <div className="space-y-1.5">
                <Label>{tNd("assignAgentLabel")}</Label>
                <Select
                  value={assignedAgentId ? assignedAgentId : ASSIGN_AGENT_NONE}
                  onValueChange={(v) =>
                    setAssignedAgentId(v === ASSIGN_AGENT_NONE ? "" : v)
                  }
                  disabled={busy}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={tNd("assignAgentPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ASSIGN_AGENT_NONE}>
                      {tNd("assignAgentNone")}
                    </SelectItem>
                    {venueAgents.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.full_name?.trim() || a.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{tNd("desiredDateLabel")}</Label>
                <Input
                  type="date"
                  value={desiredDate}
                  onChange={(e) => setDesiredDate(e.target.value)}
                  disabled={busy}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{tNd("guestCountLabel")}</Label>
                <Input
                  type="number"
                  value={guestCount}
                  onChange={(e) => setGuestCount(e.target.value)}
                  placeholder={tNd("guestCountPlaceholder")}
                  disabled={busy}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("source")}</Label>
                <Select
                  value={source}
                  onValueChange={(v) => setSource(v as InquirySource)}
                  disabled={busy}
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
                <Label>{tNd("packageInterestLabel")}</Label>
                <Input
                  value={packageInterest}
                  onChange={(e) => setPackageInterest(e.target.value)}
                  placeholder={tNd("packageInterestPlaceholder")}
                  disabled={busy}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{tNd("notesLabel")}</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                disabled={busy}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onClose()} disabled={busy}>
            {tc("cancel")}
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={busy || !canSubmit}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {tNd("submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
