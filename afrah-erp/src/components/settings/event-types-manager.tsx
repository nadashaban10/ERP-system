"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Plus, Trash2, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/toaster";
import { Can } from "@/components/auth/can";
import {
  useCreateEventType,
  useDeleteEventType,
} from "@/lib/queries/event-types";
import { showMutationError } from "@/lib/queries/helpers";
import type { EventRecordType, TimeModel } from "@/lib/types/database";

interface EventTypesManagerProps {
  hallId: string;
  eventTypes: EventRecordType[];
}

export function EventTypesManager({
  hallId,
  eventTypes,
}: EventTypesManagerProps) {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");

  const [name, setName] = useState("");
  const [timeModel, setTimeModel] = useState<TimeModel>("shift_based");
  const [pendingDelete, setPendingDelete] = useState<EventRecordType | null>(
    null
  );

  const createEventType = useCreateEventType();
  const deleteEventType = useDeleteEventType();

  async function handleAdd() {
    if (!name.trim()) return;
    try {
      await createEventType.mutateAsync({
        hall_id: hallId,
        name: name.trim(),
        time_model: timeModel,
      });
      setName("");
      toast({
        variant: "success",
        title: t("eventTypeCreated") || "Event type added",
      });
    } catch (error) {
      showMutationError(error, "Add event type failed");
    }
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    try {
      await deleteEventType.mutateAsync(pendingDelete.id);
      toast({
        variant: "success",
        title: t("eventTypeDeleted") || "Event type removed",
      });
    } catch (error) {
      showMutationError(error, "Delete failed");
    } finally {
      setPendingDelete(null);
    }
  }

  return (
    <div className="mt-3 rounded-lg border border-dashed border-border bg-muted/30 p-3">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <CalendarClock className="h-3.5 w-3.5" />
        {t("eventTypes")}
      </div>

      {eventTypes.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          {t("noEventTypes") ||
            "No event types yet — add Wedding, Birthday, Engagement, etc."}
        </p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {eventTypes.map((et) => (
            <span
              key={et.id}
              className="inline-flex items-center gap-1.5 rounded-full bg-card border border-border px-2.5 py-1 text-xs"
            >
              <span className="font-medium">{et.name}</span>
              <span className="text-muted-foreground text-[10px]">
                · {t(et.time_model) || et.time_model.replace("_", " ")}
              </span>
              <Can permission="venues.edit">
                <button
                  type="button"
                  onClick={() => setPendingDelete(et)}
                  className="rounded-full p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  aria-label={`Remove ${et.name}`}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </Can>
            </span>
          ))}
        </div>
      )}

      <Can permission="venues.edit">
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1">
            <Label className="text-xs">{t("eventTypeName") || "Name"}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAdd();
                }
              }}
              placeholder={t("eventTypePlaceholder") || "Wedding, Birthday…"}
              className="h-9"
            />
          </div>
          <div className="space-y-1 sm:w-44">
            <Label className="text-xs">{t("timeModel") || "Time model"}</Label>
            <Select
              value={timeModel}
              onValueChange={(v: TimeModel) => setTimeModel(v)}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="shift_based">
                  {t("shift_based") || "Shift-based"}
                </SelectItem>
                <SelectItem value="slot_based">
                  {t("slot_based") || "Slot-based"}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={handleAdd}
            disabled={createEventType.isPending || !name.trim()}
            className="gap-1.5"
          >
            {createEventType.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {tCommon("save")}
          </Button>
        </div>
      </Can>

      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("confirmDeleteEventType") || "Delete this event type?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.name}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {tCommon("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
