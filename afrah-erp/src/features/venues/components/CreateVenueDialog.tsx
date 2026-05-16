"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useOwnersList } from "@/lib/queries/useUserManagement";
import {
  createVenueSchema,
  type CreateVenueSchemaOut,
} from "@/features/venues/schemas/createVenueSchema";
import { useCreateVenue } from "@/features/venues/hooks/useCreateVenue";
import { formValuesToRpcPayload } from "@/features/venues/api/createVenue";

const VENUE_TYPES = ["hall", "hotel", "garden", "boat", "other"] as const;
const CITIES = ["cairo", "giza", "alexandria", "other"] as const;
const SUBSCRIPTION_PLANS = ["trial", "starter", "professional"] as const;

export interface CreateVenueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function emptyValues(): CreateVenueSchemaOut {
  return {
    name_ar: "",
    name_en: "",
    type: "hall",
    address: "",
    city: "cairo",
    district: "",
    phone_1: "",
    phone_2: "",
    instagram: "",
    facebook: "",
    description_ar: "",
    description_en: "",
    logo_url: "",
    marketplace_active: false,
    edit_cutoff_days: 30,
    edit_cutoff_override: false,
    subscription_plan: "trial",
    trial_ends_at: "",
    owner_id: "",
  };
}

export function CreateVenueDialog({ open, onOpenChange }: CreateVenueDialogProps) {
  const t = useTranslations("settings");
  const createVenue = useCreateVenue();

  const form = useForm<CreateVenueSchemaOut>({
    resolver: zodResolver(createVenueSchema),
    defaultValues: emptyValues(),
  });

  const ownersQuery = useOwnersList(open);
  const owners = ownersQuery.data ?? [];

  useEffect(() => {
    if (open) {
      form.reset(emptyValues());
    }
  }, [open, form]);

  const busy = createVenue.isPending;

  const onSubmit = (values: CreateVenueSchemaOut) => {
    const ownerId = values.owner_id?.trim() ? values.owner_id.trim() : null;
    createVenue.mutate(
      { venue: formValuesToRpcPayload(values), ownerId },
      {
        onSuccess: () => {
          form.reset(emptyValues());
          onOpenChange(false);
        },
      }
    );
  };

  const typeLabels = useMemo(
    () =>
      ({
        hall: t("createVenueTypeHall"),
        hotel: t("createVenueTypeHotel"),
        garden: t("createVenueTypeGarden"),
        boat: t("createVenueTypeBoat"),
        other: t("createVenueTypeOther"),
      }) as Record<(typeof VENUE_TYPES)[number], string>,
    [t]
  );

  const cityLabels = useMemo(
    () =>
      ({
        cairo: t("createVenueCityCairo"),
        giza: t("createVenueCityGiza"),
        alexandria: t("createVenueCityAlex"),
        other: t("createVenueCityOther"),
      }) as Record<(typeof CITIES)[number], string>,
    [t]
  );

  const planLabels = useMemo(
    () =>
      ({
        trial: t("createVenuePlanTrial"),
        starter: t("createVenuePlanStarter"),
        professional: t("createVenuePlanPro"),
      }) as Record<(typeof SUBSCRIPTION_PLANS)[number], string>,
    [t]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,800px)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("createVenueTitle")}</DialogTitle>
          <DialogDescription>{t("createVenueDescription")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">{t("createVenueRequiredSection")}</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name_ar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("createVenueNameAr")}</FormLabel>
                      <FormControl>
                        <Input dir="rtl" autoComplete="off" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name_en"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("createVenueNameEn")}</FormLabel>
                      <FormControl>
                        <Input autoComplete="off" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("createVenueVenueType")}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {VENUE_TYPES.map((v) => (
                            <SelectItem key={v} value={v}>
                              {typeLabels[v]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("city")}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CITIES.map((c) => (
                            <SelectItem key={c} value={c}>
                              {cityLabels[c]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("address")}</FormLabel>
                    <FormControl>
                      <Input autoComplete="street-address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone_1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("createVenuePhone1")}</FormLabel>
                    <FormControl>
                      <Input type="tel" inputMode="tel" autoComplete="tel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">{t("createVenueOptionalSection")}</h3>
              <FormField
                control={form.control}
                name="district"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("createVenueDistrict")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="phone_2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("secondaryPhone")}</FormLabel>
                      <FormControl>
                        <Input type="tel" inputMode="tel" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="logo_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("createVenueLogoUrl")}</FormLabel>
                      <FormControl>
                        <Input type="url" inputMode="url" placeholder="https://…" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="instagram"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("instagramUrl")}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="facebook"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("facebookUrl")}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description_ar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("createVenueDescAr")}</FormLabel>
                    <FormControl>
                      <Textarea dir="rtl" rows={3} className="resize-y" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description_en"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("createVenueDescEn")}</FormLabel>
                    <FormControl>
                      <Textarea rows={3} className="resize-y" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="marketplace_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-xl border border-border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">{t("createVenueMarketplace")}</FormLabel>
                        <FormDescription>{t("createVenueMarketplaceHint")}</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="edit_cutoff_override"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-xl border border-border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">{t("managerOverride")}</FormLabel>
                        <FormDescription>{t("managerOverrideDesc")}</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="edit_cutoff_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("editCutoff")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={365}
                        value={Number.isFinite(field.value) ? field.value : ""}
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (raw === "") {
                            field.onChange(30);
                            return;
                          }
                          const n = Number.parseInt(raw, 10);
                          field.onChange(Number.isNaN(n) ? 30 : n);
                        }}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormDescription>{t("editCutoffHelp")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subscription_plan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("createVenueSubscription")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SUBSCRIPTION_PLANS.map((p) => (
                          <SelectItem key={p} value={p}>
                            {planLabels[p]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="trial_ends_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("createVenueTrialEnds")}</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormDescription>{t("createVenueTrialEndsHint")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">{t("createVenueOwnerSection")}</h3>
              <p className="text-sm text-muted-foreground">{t("createVenueOwnerHint")}</p>
              <FormField
                control={form.control}
                name="owner_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("createVenueAssignOwner")}</FormLabel>
                    {ownersQuery.isLoading ? (
                      <Skeleton className="h-10 w-full rounded-lg" />
                    ) : (
                      <Select
                        onValueChange={(v) => field.onChange(v === "__none__" ? "" : v)}
                        value={field.value ? field.value : "__none__"}
                        disabled={owners.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("createVenuePickOwner")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="__none__">{t("createVenuePickOwner")}</SelectItem>
                          {owners.map((o) => (
                            <SelectItem key={o.id} value={o.id}>
                              {(o.full_name?.trim() || o.email) + ` — ${o.email}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {owners.length === 0 && !ownersQuery.isLoading && (
                      <p className="text-xs text-muted-foreground">{t("createVenueNoOwners")}</p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
                {t("createVenueCancel")}
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                    {t("createVenueSubmitting")}
                  </>
                ) : (
                  t("createVenueSubmit")
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
