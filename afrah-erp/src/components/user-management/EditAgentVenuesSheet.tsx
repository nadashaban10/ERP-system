"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useUpdateAgentVenues } from "@/lib/queries/useUserManagement";

const schema = z.object({
  venueIds: z.array(z.string().uuid()).min(1, "Select at least one venue"),
});

type FormValues = z.infer<typeof schema>;

export interface EditAgentVenuesSheetProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  agent: { id: string; full_name: string } | null;
  callerRole: "owner" | "super_admin";
  callerVenues: { id: string; name_en: string }[];
  currentVenueIds: string[];
}

export function EditAgentVenuesSheet({
  open,
  onOpenChange,
  agent,
  callerVenues,
  currentVenueIds,
  callerRole: _callerRole,
}: EditAgentVenuesSheetProps) {
  const { mutate, isPending } = useUpdateAgentVenues();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { venueIds: [] },
  });

  const venueIdsWatch = form.watch("venueIds");

  useEffect(() => {
    if (!open || !agent) return;
    form.reset({ venueIds: currentVenueIds.length ? currentVenueIds : [] });
  }, [open, agent, currentVenueIds, form]);

  function toggleVenue(id: string, checked: boolean) {
    const next = new Set(venueIdsWatch);
    if (checked) next.add(id);
    else next.delete(id);
    form.setValue("venueIds", Array.from(next), { shouldValidate: true });
  }

  function onSubmit(values: FormValues) {
    if (!agent) return;
    mutate(
      { agentId: agent.id, venueIds: values.venueIds },
      {
        onSuccess: () => {
          onOpenChange(false);
          form.reset({ venueIds: [] });
        },
      }
    );
  }

  if (!agent) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Manage venues — {agent.full_name}</SheetTitle>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-1 flex-col min-h-0">
          <div className="flex-1 px-6 pb-4 min-h-0">
            {callerVenues.length === 0 ? (
              <p className="text-sm text-muted-foreground">No venues available.</p>
            ) : (
              <ScrollArea className="h-[min(420px,calc(100vh-220px))] pr-3">
                <div className="space-y-3">
                  {callerVenues.map((v) => (
                    <div key={v.id} className="flex items-center gap-3">
                      <Checkbox
                        id={`edit-venue-${v.id}`}
                        checked={venueIdsWatch.includes(v.id)}
                        onCheckedChange={(c) => toggleVenue(v.id, c === true)}
                      />
                      <Label
                        htmlFor={`edit-venue-${v.id}`}
                        className="text-sm font-normal cursor-pointer leading-snug"
                      >
                        {v.name_en}
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
            {form.formState.errors.venueIds && (
              <p className="text-sm text-destructive mt-2">
                {form.formState.errors.venueIds.message}
              </p>
            )}
          </div>

          <SheetFooter className="mt-0 border-t bg-background">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
              Save
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
