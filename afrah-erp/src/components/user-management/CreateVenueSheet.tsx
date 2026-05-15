"use client";

import { useState, type ReactNode } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Json } from "@/lib/types/database";
import { unwrapMutation } from "@/lib/queries/helpers";
import { useOwnersList, type OwnerOption } from "@/lib/queries/useOwnersList";

const EGY_PHONE = /^01[0125]\d{8}$/;

const createVenueSchema = z.object({
  name_en: z.string().min(2, "At least 2 characters"),
  name_ar: z.string().min(2, "At least 2 characters"),
  type: z.enum(["hall", "hotel", "garden", "boat", "other"]),
  city: z.enum(["cairo", "giza", "alexandria", "other"]),
  district: z.string().optional(),
  address: z.string().min(5, "At least 5 characters"),
  phone_1: z.string().regex(EGY_PHONE, "Use format 01XXXXXXXXX (Egyptian mobile)"),
  edit_cutoff_days: z.number().min(1).max(365),
  subscription_plan: z.enum(["trial", "starter", "professional", "enterprise"]),
  ownerId: z.union([z.string().uuid(), z.literal("")]).optional(),
});

type CreateVenueForm = z.infer<typeof createVenueSchema>;

const defaultValues: CreateVenueForm = {
  name_en: "",
  name_ar: "",
  type: "hall",
  city: "cairo",
  district: "",
  address: "",
  phone_1: "",
  edit_cutoff_days: 30,
  subscription_plan: "trial",
  ownerId: "",
};

export type CreateVenueSheetProps = {
  children: ReactNode;
  /** Controlled sheet — omit both for uncontrolled internal state. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Called after create so the parent can navigate to the new venue. */
  onVenueCreated?: (venueId: string) => void;
};

export function CreateVenueSheet({
  children,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  onVenueCreated,
}: CreateVenueSheetProps) {
  const queryClient = useQueryClient();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [ownerComboOpen, setOwnerComboOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const form = useForm<CreateVenueForm>({
    resolver: zodResolver(createVenueSchema),
    defaultValues,
  });

  function handleOpenChange(next: boolean) {
    if (!next) {
      form.reset(defaultValues);
    }
    if (isControlled) {
      controlledOnOpenChange?.(next);
    } else {
      setUncontrolledOpen(next);
    }
  }

  const ownersQuery = useOwnersList(open);
  const owners = ownersQuery.data ?? [];

  const mutation = useMutation({
    mutationFn: async (values: CreateVenueForm) => {
      const supabase = createClient();
      const venuePayload: Record<string, Json | undefined> = {
        name_ar: values.name_ar,
        name_en: values.name_en,
        type: values.type,
        address: values.address,
        city: values.city,
        phone_1: values.phone_1,
        edit_cutoff_days: values.edit_cutoff_days,
        subscription_plan: values.subscription_plan,
      };
      if (values.district?.trim()) {
        venuePayload.district = values.district.trim();
      }

      const owner =
        values.ownerId && values.ownerId.length > 0 ? values.ownerId : null;

      const response = await supabase.rpc("create_venue", {
        p_venue_data: venuePayload as Json,
        p_owner_id: owner,
        p_owner_role: owner ? "owner" : null,
      });

      return unwrapMutation(response, "create_venue") as {
        venue_id?: string;
        owner_linked?: boolean;
      };
    },
    onSuccess: (result) => {
      const id = result.venue_id;
      toast({
        variant: "success",
        title: "Venue created successfully",
      });
      if (result.owner_linked) {
        toast({
          variant: "success",
          title: "Owner linked to venue",
        });
      }
      queryClient.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          (q.queryKey[0] === "allVenues" ||
            (q.queryKey[0] === "venues" && q.queryKey[1] === "list")),
      });
      handleOpenChange(false);
      if (id) {
        onVenueCreated?.(id);
      }
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        variant: "destructive",
        title: "Could not create venue",
        description: message,
      });
    },
  });

  const selectedOwnerId = form.watch("ownerId");
  const selectedOwner = selectedOwnerId
    ? owners.find((x) => x.id === selectedOwnerId)
    : undefined;
  const ownerLabel = selectedOwner
    ? `${selectedOwner.full_name?.trim() || selectedOwner.email} · ${selectedOwner.email}`
    : "Select owner (optional)…";

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Create venue</SheetTitle>
        </SheetHeader>

        <form
          className="flex flex-1 flex-col overflow-hidden"
          onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
        >
          <div className="flex-1 space-y-8 overflow-y-auto px-6 py-4">
            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Venue details</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-1">
                  <Label htmlFor="name_en">Name (English)</Label>
                  <Input id="name_en" {...form.register("name_en")} />
                  {form.formState.errors.name_en && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.name_en.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2 sm:col-span-1">
                  <Label htmlFor="name_ar">Name (Arabic)</Label>
                  <Input id="name_ar" dir="rtl" {...form.register("name_ar")} />
                  {form.formState.errors.name_ar && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.name_ar.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Controller
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hall">Hall</SelectItem>
                          <SelectItem value="hotel">Hotel Ballroom</SelectItem>
                          <SelectItem value="garden">Garden</SelectItem>
                          <SelectItem value="boat">Nile Boat</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  <Controller
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="City" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cairo">Cairo</SelectItem>
                          <SelectItem value="giza">Giza</SelectItem>
                          <SelectItem value="alexandria">Alexandria</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="district">District (optional)</Label>
                <Input
                  id="district"
                  placeholder="e.g. New Cairo, Maadi"
                  {...form.register("district")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" {...form.register("address")} />
                {form.formState.errors.address && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.address.message}
                  </p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone_1">Phone</Label>
                  <Input id="phone_1" inputMode="numeric" {...form.register("phone_1")} />
                  {form.formState.errors.phone_1 && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.phone_1.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_cutoff_days">Edit cutoff (days before event)</Label>
                  <Input
                    id="edit_cutoff_days"
                    type="number"
                    min={1}
                    max={365}
                    {...form.register("edit_cutoff_days", { valueAsNumber: true })}
                  />
                  {form.formState.errors.edit_cutoff_days && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.edit_cutoff_days.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Subscription plan</Label>
                <Controller
                  control={form.control}
                  name="subscription_plan"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Plan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="trial">Trial</SelectItem>
                        <SelectItem value="starter">Starter</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Assign owner (optional)</h3>
              <p className="text-sm text-muted-foreground">
                Link an owner to this venue. You can skip this and assign an owner later from the
                venue settings.
              </p>

              <Popover open={ownerComboOpen} onOpenChange={setOwnerComboOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={ownerComboOpen}
                    className="w-full justify-between font-normal"
                  >
                    <span className="truncate text-left">{ownerLabel}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search name or email…" />
                    <CommandList>
                      <CommandEmpty>No owners found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="__clear__"
                          onSelect={() => {
                            form.setValue("ownerId", "");
                            setOwnerComboOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              !form.watch("ownerId") ? "opacity-100" : "opacity-0"
                            )}
                          />
                          None
                        </CommandItem>
                        {owners.map((o: OwnerOption) => (
                          <CommandItem
                            key={o.id}
                            value={`${o.id} ${o.full_name ?? ""} ${o.email}`}
                            onSelect={() => {
                              form.setValue("ownerId", o.id);
                              setOwnerComboOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                form.watch("ownerId") === o.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <span className="truncate">
                              {(o.full_name?.trim() || o.email) + ` · ${o.email}`}
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </section>
          </div>

          <SheetFooter className="border-t bg-background">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              )}
              Create Venue
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
