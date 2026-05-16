"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, Loader2, UserCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useOwnersList } from "@/lib/queries/useUserManagement";
import { useVenuesList } from "@/lib/queries/useVenuesList";
import { createCreateUserSchema } from "@/features/users/schemas/createUserSchema";
import { useCreateUser } from "@/features/users/hooks/useCreateUser";
import type { MyProfile } from "@/lib/auth/my-profile";
import type {
  CreateUserEdgeBody,
  CreateUserFormCaller,
  CreateUserFormValues,
} from "@/features/users/types/user";

export interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: MyProfile;
}

type VenueListConfig =
  | { kind: "all" }
  | { kind: "owned"; ownerUserId: string }
  | { kind: "none" };

function emptyFormValues(): CreateUserFormValues {
  return {
    full_name: "",
    email: "",
    password: "",
    role: "agent",
    owner_id: "",
    venue_ids: [],
  };
}

function buildEdgePayload(
  values: CreateUserFormValues,
  profile: MyProfile,
  isSuperAdmin: boolean
): CreateUserEdgeBody {
  const venue_ids = Array.from(
    new Set(
      (Array.isArray(values.venue_ids) ? values.venue_ids : [])
        .map((id) => String(id))
        .filter(Boolean)
    )
  );
  if (!isSuperAdmin) {
    return {
      email: values.email,
      password: values.password,
      full_name: values.full_name,
      role: "agent",
      owner_id: profile.user_id,
      venue_ids,
    };
  }
  if (values.role === "owner") {
    return {
      email: values.email,
      password: values.password,
      full_name: values.full_name,
      role: "owner",
      venue_ids,
    };
  }
  const ownerId = values.owner_id?.trim();
  if (!ownerId) {
    throw new Error("Select an owner for this agent");
  }
  return {
    email: values.email,
    password: values.password,
    full_name: values.full_name,
    role: "agent",
    owner_id: ownerId,
    venue_ids,
  };
}

export function CreateUserDialog({ open, onOpenChange, profile }: CreateUserDialogProps) {
  const t = useTranslations("users");
  const locale = useLocale();
  const [showPassword, setShowPassword] = useState(false);

  const isSuperAdmin = profile.role === "super_admin";
  const caller: CreateUserFormCaller = isSuperAdmin ? "super_admin" : "owner";

  const schema = useMemo(() => createCreateUserSchema({ caller }), [caller]);

  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyFormValues(),
  });

  const roleWatch = form.watch("role");
  const ownerWatch = form.watch("owner_id");

  const ownersQuery = useOwnersList(Boolean(open && isSuperAdmin && roleWatch === "agent"));

  const venueCfg: VenueListConfig = useMemo(() => {
    if (!open) return { kind: "none" };
    if (profile.role === "owner") {
      return { kind: "owned", ownerUserId: profile.user_id };
    }
    if (profile.role === "super_admin") {
      if (roleWatch === "owner") return { kind: "all" };
      if (roleWatch === "agent" && ownerWatch?.trim()) {
        return { kind: "owned", ownerUserId: ownerWatch.trim() };
      }
    }
    return { kind: "none" };
  }, [open, profile.role, profile.user_id, roleWatch, ownerWatch]);

  const venuesQuery = useVenuesList(
    venueCfg.kind === "none"
      ? { scope: "owned", ownerUserId: "" }
      : venueCfg.kind === "all"
        ? { scope: "all" }
        : { scope: "owned", ownerUserId: venueCfg.ownerUserId }
  );

  const createUser = useCreateUser();

  const prevRole = useRef<CreateUserFormValues["role"]>("agent");
  const prevOwner = useRef<string>("");

  useEffect(() => {
    if (open) {
      form.reset(emptyFormValues());
      setShowPassword(false);
      prevRole.current = "agent";
      prevOwner.current = "";
    }
  }, [open, form]);

  useEffect(() => {
    if (profile.role === "owner" && open) {
      form.setValue("role", "agent", { shouldValidate: false });
    }
  }, [profile.role, open, form]);

  useEffect(() => {
    if (!open || !isSuperAdmin) return;
    if (prevRole.current !== roleWatch) {
      form.setValue("venue_ids", []);
      if (roleWatch === "owner") {
        form.setValue("owner_id", "");
      }
    }
    prevRole.current = roleWatch;
  }, [roleWatch, open, isSuperAdmin, form]);

  useEffect(() => {
    if (!open || !isSuperAdmin || roleWatch !== "agent") return;
    if (prevOwner.current !== ownerWatch) {
      form.setValue("venue_ids", []);
    }
    prevOwner.current = ownerWatch;
  }, [ownerWatch, roleWatch, open, isSuperAdmin, form]);

  function onSubmit(values: CreateUserFormValues) {
    console.log("create user values", values);
    console.log("venue_ids", values.venue_ids);

    if (venueCfg.kind !== "none" && venuesQuery.isLoading) {
      form.setError("venue_ids", {
        type: "validate",
        message: t("createUserVenuesLoading"),
      });
      return;
    }

    if (venueCfg.kind !== "none" && venuesQuery.isSuccess) {
      const allowed = new Set(venuesQuery.data.map((v) => String(v.id)));
      for (const id of values.venue_ids ?? []) {
        if (!allowed.has(String(id))) {
          form.setError("venue_ids", {
            type: "validate",
            message: t("createUserVenueScopeError"),
          });
          return;
        }
      }
    }

    try {
      const body = buildEdgePayload(values, profile, isSuperAdmin);
      console.log("payload", body);
      createUser.mutate(body, {
        onSuccess: () => {
          form.reset(emptyFormValues());
          onOpenChange(false);
        },
      });
    } catch {
      /* defensive */
    }
  }

  const owners = ownersQuery.data ?? [];
  const venues = venuesQuery.data ?? [];

  const busy = createUser.isPending;
  /** Only disable during first venues fetch — avoid pinning submit forever if TanStack loading flags flake. */
  const venuesBlocking =
    venueCfg.kind !== "none" && venuesQuery.isPending && venues.length === 0;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,720px)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("createUserTitle")}</DialogTitle>
          <DialogDescription>{t("createUserDescription")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("createUserFullName")}</FormLabel>
                  <FormControl>
                    <Input autoComplete="name" placeholder={t("createUserFullNamePlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("createUserEmail")}</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      autoComplete="email"
                      placeholder={t("createUserEmailPlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("createUserPassword")}</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        className="pr-10"
                        placeholder={t("createUserPasswordPlaceholder")}
                        {...field}
                      />
                    </FormControl>
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={
                        showPassword ? t("createUserHidePassword") : t("createUserShowPassword")
                      }
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isSuperAdmin && (
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("createUserRoleLabel")}</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(v as CreateUserFormValues["role"])}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("createUserRolePlaceholder")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="agent">{t("createUserRoleAgent")}</SelectItem>
                        <SelectItem value="owner">{t("createUserRoleOwner")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>{t("createUserRoleHint")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {!isSuperAdmin && (
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <div className="flex gap-3">
                  <UserCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                  <div>
                    <p className="text-sm font-medium">{t("createUserRoleAgent")}</p>
                    <p className="text-xs text-muted-foreground">{t("createUserOwnerCreatesAgentHint")}</p>
                  </div>
                </div>
              </div>
            )}

            {isSuperAdmin && roleWatch === "agent" && (
              <FormField
                control={form.control}
                name="owner_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("createUserAssignOwner")}</FormLabel>
                    {ownersQuery.isLoading ? (
                      <Skeleton className="h-10 w-full rounded-lg" />
                    ) : (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || undefined}
                        disabled={owners.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("createUserPickOwner")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {owners.map((o) => (
                            <SelectItem key={o.id} value={o.id}>
                              {`${o.full_name?.trim() || "—"} — ${o.email}`}
                              {o.status && o.status !== "active" ? ` (${o.status})` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <FormDescription>{t("createUserAssignOwnerHint")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="venue_ids"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel suppressHtmlFor>{t("createUserVenues")}</FormLabel>
                  <FormDescription>{t("createUserVenuesHint")}</FormDescription>
                  {venueCfg.kind === "none" && isSuperAdmin && roleWatch === "agent" && (
                    <p className="text-sm text-muted-foreground">{t("createUserSelectOwnerFirst")}</p>
                  )}
                  {venueCfg.kind !== "none" && venuesQuery.isLoading && (
                    <div className="space-y-2 rounded-xl border border-border p-3">
                      <Skeleton className="h-5 w-full" />
                      <Skeleton className="h-5 w-[85%]" />
                      <Skeleton className="h-5 w-[70%]" />
                    </div>
                  )}
                  {venueCfg.kind !== "none" && venuesQuery.isSuccess && venues.length === 0 && (
                    <p className="text-sm text-muted-foreground">{t("createUserNoVenues")}</p>
                  )}
                  {venueCfg.kind !== "none" && venuesQuery.isSuccess && venues.length > 0 && (
                    <div
                      role="group"
                      className="max-h-48 space-y-2 overflow-y-auto rounded-xl border border-border p-3"
                      aria-label={t("createUserVenues")}
                    >
                      {venues.map((v) => {
                        const venueId = String(v.id);
                        const label =
                          locale === "ar" && v.name_ar?.trim() ? v.name_ar : v.name_en;
                        const selectedVenueIds = Array.isArray(field.value) ? field.value : [];
                        const checked = selectedVenueIds.some((id) => String(id) === venueId);
                        const chkId = `create-user-venue-${venueId}`;
                        return (
                          <div key={venueId}>
                            <label
                              htmlFor={chkId}
                              className={cn(
                                "flex cursor-pointer items-center gap-3 rounded-lg px-1 py-1.5 text-sm hover:bg-muted/60"
                              )}
                            >
                              <Checkbox
                                id={chkId}
                                checked={checked}
                                onCheckedChange={(c) => {
                                  const ids = Array.isArray(field.value) ? field.value : [];
                                  const asStrings = ids.map((id) => String(id)).filter(Boolean);
                                  const next =
                                    c === true
                                      ? Array.from(new Set([...asStrings, venueId]))
                                      : asStrings.filter((id) => id !== venueId);
                                  form.setValue("venue_ids", next, {
                                    shouldValidate: true,
                                    shouldDirty: true,
                                    shouldTouch: true,
                                  });
                                }}
                              />
                              <span>{label}</span>
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
                {t("createUserCancel")}
              </Button>
              <Button type="submit" disabled={busy || venuesBlocking}>
                {busy ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                    {t("createUserSubmitting")}
                  </>
                ) : (
                  t("createUserSubmit")
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
