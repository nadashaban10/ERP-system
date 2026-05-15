"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, Check, ChevronsUpDown, Eye, EyeOff, Loader2, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  useCreateUser,
  useOwnersList,
  useVenuesByOwner,
} from "@/lib/queries/useUserManagement";

export interface CreateUserSheetProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  callerRole: "owner" | "super_admin";
  callerVenues: { id: string; name_en: string }[];
}

const baseFields = {
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "At least 8 characters"),
  role: z.enum(["agent", "owner"]),
  owner_id: z.string().uuid().optional(),
  venue_ids: z.array(z.string().uuid()),
};

function buildSchema(callerRole: "owner" | "super_admin") {
  return z.object(baseFields).superRefine((data, ctx) => {
    if (data.role === "agent") {
      if (!data.venue_ids.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Select at least one venue",
          path: ["venue_ids"],
        });
      }
      if (
        callerRole === "super_admin" &&
        (!data.owner_id || data.owner_id.trim() === "")
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Select an owner",
          path: ["owner_id"],
        });
      }
    }
  });
}

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

function defaultValues(roleDefault: "agent" | "owner"): FormValues {
  return {
    full_name: "",
    email: "",
    password: "",
    role: roleDefault,
    owner_id: undefined,
    venue_ids: [],
  };
}

export function CreateUserSheet({
  open,
  onOpenChange,
  callerRole,
  callerVenues,
}: CreateUserSheetProps) {
  const schema = useMemo(() => buildSchema(callerRole), [callerRole]);
  const [showPassword, setShowPassword] = useState(false);
  const [ownerComboOpen, setOwnerComboOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues(callerRole === "owner" ? "agent" : "agent"),
  });

  const { register, control, handleSubmit, reset, setValue, watch, formState } = form;
  const roleWatch = useWatch({ control, name: "role", defaultValue: "agent" });
  const ownerIdWatch = useWatch({ control, name: "owner_id" });
  const venueIds = watch("venue_ids") ?? [];

  const { data: owners = [], isLoading: ownersLoading } = useOwnersList(
    open && callerRole === "super_admin"
  );
  const venuesByOwnerQuery = useVenuesByOwner(
    callerRole === "super_admin" && roleWatch === "agent" ? ownerIdWatch ?? null : null
  );

  const { mutate, isPending } = useCreateUser();

  const venueOptions =
    callerRole === "owner"
      ? callerVenues
      : (venuesByOwnerQuery.data ?? []).map((v) => ({
          id: v.id,
          name_en: v.name_en,
        }));

  const showOwnerPicker = callerRole === "super_admin" && roleWatch === "agent";
  const showVenues = roleWatch === "agent";

  useEffect(() => {
    if (!open) {
      reset(defaultValues(callerRole === "owner" ? "agent" : "agent"));
      setShowPassword(false);
      setOwnerComboOpen(false);
    }
  }, [open, callerRole, reset]);

  useEffect(() => {
    if (callerRole === "owner") {
      setValue("role", "agent", { shouldValidate: true });
    }
  }, [callerRole, setValue]);

  useEffect(() => {
    if (roleWatch === "owner") {
      setValue("venue_ids", []);
      setValue("owner_id", undefined);
    }
  }, [roleWatch, setValue]);

  useEffect(() => {
    if (!open || roleWatch !== "agent") return;
    setValue("venue_ids", []);
  }, [ownerIdWatch, open, roleWatch, setValue]);

  const selectedOwner = owners.find((o) => o.id === ownerIdWatch);
  const ownerLabel = selectedOwner
    ? `${selectedOwner.full_name?.trim() || "—"} — ${selectedOwner.email}`
    : "Select an owner…";

  function onSubmit(values: FormValues) {
    mutate(
      {
        email: values.email,
        password: values.password,
        full_name: values.full_name,
        role: values.role,
        owner_id: values.owner_id,
        venue_ids: values.role === "agent" ? values.venue_ids : [],
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          reset(defaultValues(callerRole === "owner" ? "agent" : "agent"));
        },
      }
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Create new user</SheetTitle>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 space-y-4 overflow-y-auto px-6 pb-4">
            <div className="space-y-2">
              <Label htmlFor="cu_full_name">Full name</Label>
              <Input id="cu_full_name" placeholder="Full name" {...register("full_name")} />
              {formState.errors.full_name && (
                <p className="text-xs text-destructive">{formState.errors.full_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cu_email">Email</Label>
              <Input
                id="cu_email"
                type="email"
                placeholder="Email address"
                autoComplete="email"
                {...register("email")}
              />
              {formState.errors.email && (
                <p className="text-xs text-destructive">{formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cu_password">Password</Label>
              <div className="relative">
                <Input
                  id="cu_password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min 8 characters"
                  autoComplete="new-password"
                  className="pr-10"
                  {...register("password")}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {formState.errors.password && (
                <p className="text-xs text-destructive">{formState.errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              {callerRole === "owner" ? (
                <div className="flex rounded-xl border border-border p-1">
                  <div
                    className={cn(
                      "flex flex-1 gap-3 rounded-lg border px-3 py-3 text-left",
                      "border-primary bg-primary/10 ring-2 ring-primary/20"
                    )}
                  >
                    <UserCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                    <div>
                      <p className="text-sm font-medium">Agent</p>
                      <p className="text-xs text-muted-foreground">
                        Operational staff. Manages bookings and inquiries.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <Controller
                  control={control}
                  name="role"
                  render={({ field }) => (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => field.onChange("agent")}
                        className={cn(
                          "flex gap-3 rounded-xl border px-3 py-3 text-left transition-colors",
                          field.value === "agent"
                            ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                            : "border-border bg-muted/30 hover:bg-muted/50"
                        )}
                      >
                        <UserCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                        <div>
                          <p className="text-sm font-medium">Agent</p>
                          <p className="text-xs text-muted-foreground">
                            Operational staff. Manages bookings and inquiries.
                          </p>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => field.onChange("owner")}
                        className={cn(
                          "flex gap-3 rounded-xl border px-3 py-3 text-left transition-colors",
                          field.value === "owner"
                            ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                            : "border-border bg-muted/30 hover:bg-muted/50"
                        )}
                      >
                        <Building2
                          className="mt-0.5 h-5 w-5 shrink-0 text-primary"
                          aria-hidden
                        />
                        <div>
                          <p className="text-sm font-medium">Owner</p>
                          <p className="text-xs text-muted-foreground">
                            Business account owner. Manages venues and agents.
                          </p>
                        </div>
                      </button>
                    </div>
                  )}
                />
              )}
              {formState.errors.role && (
                <p className="text-xs text-destructive">{formState.errors.role.message}</p>
              )}
            </div>

            {showOwnerPicker && (
              <div className="space-y-2">
                <Label>Assign to owner</Label>
                <Popover open={ownerComboOpen} onOpenChange={setOwnerComboOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={ownerComboOpen}
                      className="w-full justify-between font-normal"
                      disabled={ownersLoading}
                    >
                      <span className="truncate text-left">
                        {ownersLoading ? "Loading owners…" : ownerLabel}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[var(--radix-popover-trigger-width)] p-0 z-[120]"
                    align="start"
                  >
                    <Command>
                      <CommandInput placeholder="Search name or email…" />
                      <CommandList>
                        <CommandEmpty>No owners found.</CommandEmpty>
                        <CommandGroup>
                          {owners.map((o) => (
                            <CommandItem
                              key={o.id}
                              value={`${o.full_name ?? ""} ${o.email}`.trim()}
                              onSelect={() => {
                                setValue("owner_id", o.id, {
                                  shouldValidate: true,
                                  shouldDirty: true,
                                });
                                setOwnerComboOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  ownerIdWatch === o.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <span className="truncate">
                                {`${o.full_name?.trim() || "—"} — ${o.email}`}
                              </span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {formState.errors.owner_id && (
                  <p className="text-xs text-destructive">{formState.errors.owner_id.message}</p>
                )}
              </div>
            )}

            {showVenues && (
              <div className="space-y-2">
                <Label>Assign to venues</Label>
                <p className="text-xs text-muted-foreground">
                  Agent can only access assigned venues
                </p>
                {callerRole === "super_admin" && !ownerIdWatch ? (
                  <p className="text-sm text-muted-foreground">Select an owner first</p>
                ) : callerRole === "super_admin" && venuesByOwnerQuery.isLoading ? (
                  <div className="space-y-2 rounded-xl border border-border p-3">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-[85%]" />
                    <Skeleton className="h-5 w-[70%]" />
                  </div>
                ) : venueOptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No venues available.</p>
                ) : (
                  <div className="max-h-48 space-y-2 overflow-y-auto rounded-xl border border-border p-3">
                    {venueOptions.map((v) => (
                      <label
                        key={v.id}
                        className="flex cursor-pointer items-center gap-3 rounded-lg px-1 py-1.5 text-sm hover:bg-muted/60"
                      >
                        <Checkbox
                          checked={venueIds.includes(v.id)}
                          onCheckedChange={(checked) => {
                            const next =
                              checked === true
                                ? [...venueIds, v.id]
                                : venueIds.filter((id) => id !== v.id);
                            setValue("venue_ids", next, { shouldValidate: true, shouldDirty: true });
                          }}
                        />
                        <span>{v.name_en}</span>
                      </label>
                    ))}
                  </div>
                )}
                {formState.errors.venue_ids && (
                  <p className="text-xs text-destructive">
                    {String(formState.errors.venue_ids.message)}
                  </p>
                )}
              </div>
            )}
          </div>

          <SheetFooter className="mt-0 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
              Create user
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
