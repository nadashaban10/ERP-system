"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Building2,
  CalendarDays,
  LayoutGrid,
  Loader2,
  Package as PackageIcon,
  Pencil,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { hasPermission } from "@/lib/auth/my-profile";
import { useMyProfile } from "@/lib/auth/use-my-profile";
import { formatCurrency } from "@/lib/utils";
import { useUpdateVenue, useVenue, type VenueProfileUpdate } from "@/lib/queries/venue";
import {
  useDeleteHall,
  useHalls,
  useUpdateHall,
  type HallWithEventTypes,
} from "@/lib/queries/halls";
import {
  useDeletePackage,
  usePackages,
  useUpdatePackage,
} from "@/lib/queries/packages";
import { showMutationError } from "@/lib/queries/helpers";
import { HallFormDialog } from "@/components/settings/hall-form-dialog";
import { PackageFormDialog } from "@/components/settings/package-form-dialog";
import { EventTypesManager } from "@/components/settings/event-types-manager";
import type { CityEnum, Package, Venue, VenueType } from "@/lib/types/database";

type VenueFormShape = Pick<
  Venue,
  | "name_ar"
  | "name_en"
  | "type"
  | "city"
  | "address"
  | "phone_1"
  | "phone_2"
  | "instagram"
  | "facebook"
  | "edit_cutoff_days"
  | "edit_cutoff_override"
>;

function emptyVenueForm(): VenueFormShape {
  return {
    name_ar: "",
    name_en: "",
    type: "hall",
    city: "cairo",
    address: "",
    phone_1: "",
    phone_2: null,
    instagram: null,
    facebook: null,
    edit_cutoff_days: 30,
    edit_cutoff_override: false,
  };
}

export function SettingsContent() {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const { data: profile } = useMyProfile();

  const canEditVenue = hasPermission(profile, "venues.edit");
  const canViewVenue = hasPermission(profile, "venues.view");
  const canManageBilling = hasPermission(profile, "billing.manage");

  // ─── Data ───────────────────────────────────────────────────────────────────
  const venueQuery = useVenue();
  const hallsQuery = useHalls();
  const packagesQuery = usePackages();

  const updateVenue = useUpdateVenue();
  const updateHall = useUpdateHall();
  const deleteHall = useDeleteHall();
  const updatePackage = useUpdatePackage();
  const deletePackage = useDeletePackage();

  // ─── Venue profile form (local copy of server value) ────────────────────────
  const [venueForm, setVenueForm] = useState<VenueFormShape>(emptyVenueForm);

  // Hydrate the form whenever the venue query settles. We only sync once per
  // server payload to avoid clobbering in-flight edits the user is making.
  useEffect(() => {
    if (!venueQuery.data) return;
    const v = venueQuery.data;
    setVenueForm({
      name_ar: v.name_ar,
      name_en: v.name_en,
      type: v.type,
      city: v.city,
      address: v.address,
      phone_1: v.phone_1,
      phone_2: v.phone_2,
      instagram: v.instagram,
      facebook: v.facebook,
      edit_cutoff_days: v.edit_cutoff_days,
      edit_cutoff_override: v.edit_cutoff_override,
    });
  }, [venueQuery.data]);

  // ─── Dialog state ───────────────────────────────────────────────────────────
  const [hallDialog, setHallDialog] = useState<{
    open: boolean;
    hall: HallWithEventTypes | null;
  }>({ open: false, hall: null });
  const [packageDialog, setPackageDialog] = useState<{
    open: boolean;
    pkg: Package | null;
  }>({ open: false, pkg: null });
  const [pendingHallDelete, setPendingHallDelete] =
    useState<HallWithEventTypes | null>(null);
  const [pendingPackageDelete, setPendingPackageDelete] =
    useState<Package | null>(null);

  // ─── Handlers ───────────────────────────────────────────────────────────────
  async function handleSaveVenue() {
    if (!venueQuery.data) return;
    const changes: VenueProfileUpdate = {
      name_ar: venueForm.name_ar,
      name_en: venueForm.name_en,
      type: venueForm.type,
      city: venueForm.city,
      address: venueForm.address,
      phone_1: venueForm.phone_1,
      phone_2: venueForm.phone_2,
      instagram: venueForm.instagram,
      facebook: venueForm.facebook,
      edit_cutoff_days: venueForm.edit_cutoff_days,
      edit_cutoff_override: venueForm.edit_cutoff_override,
    };
    try {
      await updateVenue.mutateAsync({ id: venueQuery.data.id, changes });
      toast({ variant: "success", title: tCommon("save") });
    } catch (error) {
      showMutationError(error, "Save failed");
    }
  }

  async function handleToggleHallActive(hall: HallWithEventTypes, next: boolean) {
    try {
      await updateHall.mutateAsync({
        id: hall.id,
        changes: { is_active: next },
      });
    } catch (error) {
      showMutationError(error, "Update failed");
    }
  }

  async function handleConfirmDeleteHall() {
    if (!pendingHallDelete) return;
    try {
      await deleteHall.mutateAsync(pendingHallDelete.id);
      toast({ variant: "success", title: t("hallDeleted") });
    } catch (error) {
      showMutationError(error, "Delete failed");
    } finally {
      setPendingHallDelete(null);
    }
  }

  async function handleTogglePackageActive(pkg: Package, next: boolean) {
    try {
      await updatePackage.mutateAsync({
        id: pkg.id,
        changes: { is_active: next },
      });
    } catch (error) {
      showMutationError(error, "Update failed");
    }
  }

  async function handleConfirmDeletePackage() {
    if (!pendingPackageDelete) return;
    try {
      await deletePackage.mutateAsync(pendingPackageDelete.id);
      toast({ variant: "success", title: t("packageDeleted") });
    } catch (error) {
      showMutationError(error, "Delete failed");
    } finally {
      setPendingPackageDelete(null);
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────────
  const venueLoading = venueQuery.isPending;
  const venueError = venueQuery.isError;
  const venueId = venueQuery.data?.id;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      {venueError && (
        <Card className="border-destructive/40 bg-red-50">
          <CardContent className="p-4 text-sm text-destructive">
            {t("loadVenueError")}: {venueQuery.error?.message}
          </CardContent>
        </Card>
      )}

      <Tabs
        defaultValue={
          canViewVenue ? "venue" : canManageBilling ? "billing" : "general"
        }
      >
        <TabsList className="h-auto flex-wrap">
          {canViewVenue && (
            <TabsTrigger value="venue" className="gap-1.5">
              <Building2 className="h-4 w-4" />
              {t("venue")}
            </TabsTrigger>
          )}
          {canViewVenue && (
            <TabsTrigger value="halls" className="gap-1.5">
              <LayoutGrid className="h-4 w-4" />
              {t("halls")}
            </TabsTrigger>
          )}
          {canViewVenue && (
            <TabsTrigger value="packages" className="gap-1.5">
              <PackageIcon className="h-4 w-4" />
              {t("packages")}
            </TabsTrigger>
          )}
          <TabsTrigger value="general" className="gap-1.5">
            <CalendarDays className="h-4 w-4" />
            {t("general")}
          </TabsTrigger>
          {canManageBilling && (
            <TabsTrigger value="billing" className="gap-1.5">
              <Users className="h-4 w-4" />
              {t("billing")}
            </TabsTrigger>
          )}
        </TabsList>

        {/* ─── Venue Tab ─── */}
        <TabsContent value="venue">
          <Card>
            <CardHeader>
              <CardTitle>{t("venueProfile")}</CardTitle>
              <CardDescription>{t("venueProfileDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {venueLoading ? (
                <SettingsFormSkeleton />
              ) : !venueQuery.data ? (
                <p className="text-sm text-muted-foreground">
                  {t("loadVenueError")}
                </p>
              ) : (
                <fieldset
                  disabled={!canEditVenue}
                  className="contents disabled:opacity-100"
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>{t("venueName")}</Label>
                      <Input
                        value={venueForm.name_ar}
                        dir="rtl"
                        readOnly={!canEditVenue}
                        onChange={(e) =>
                          setVenueForm((v) => ({
                            ...v,
                            name_ar: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>{t("venueNameEn")}</Label>
                      <Input
                        value={venueForm.name_en}
                        readOnly={!canEditVenue}
                        onChange={(e) =>
                          setVenueForm((v) => ({
                            ...v,
                            name_en: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>{t("venueType")}</Label>
                      <Select
                        value={venueForm.type}
                        disabled={!canEditVenue}
                        onValueChange={(v: VenueType) =>
                          setVenueForm((vn) => ({ ...vn, type: v }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hall">Hall</SelectItem>
                          <SelectItem value="hotel">Hotel</SelectItem>
                          <SelectItem value="garden">Garden</SelectItem>
                          <SelectItem value="boat">Boat</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>{t("city")}</Label>
                      <Select
                        value={venueForm.city}
                        disabled={!canEditVenue}
                        onValueChange={(v: CityEnum) =>
                          setVenueForm((vn) => ({ ...vn, city: v }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cairo">Cairo</SelectItem>
                          <SelectItem value="giza">Giza</SelectItem>
                          <SelectItem value="alexandria">Alexandria</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>{t("address")}</Label>
                      <Input
                        value={venueForm.address}
                        readOnly={!canEditVenue}
                        onChange={(e) =>
                          setVenueForm((v) => ({
                            ...v,
                            address: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>{t("primaryPhone")}</Label>
                      <Input
                        value={venueForm.phone_1}
                        readOnly={!canEditVenue}
                        onChange={(e) =>
                          setVenueForm((v) => ({
                            ...v,
                            phone_1: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>{t("secondaryPhone")}</Label>
                      <Input
                        value={venueForm.phone_2 ?? ""}
                        readOnly={!canEditVenue}
                        onChange={(e) =>
                          setVenueForm((v) => ({
                            ...v,
                            phone_2: e.target.value || null,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>{t("instagramUrl")}</Label>
                      <Input
                        value={venueForm.instagram ?? ""}
                        readOnly={!canEditVenue}
                        onChange={(e) =>
                          setVenueForm((v) => ({
                            ...v,
                            instagram: e.target.value || null,
                          }))
                        }
                        placeholder="https://instagram.com/..."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>{t("facebookUrl")}</Label>
                      <Input
                        value={venueForm.facebook ?? ""}
                        readOnly={!canEditVenue}
                        onChange={(e) =>
                          setVenueForm((v) => ({
                            ...v,
                            facebook: e.target.value || null,
                          }))
                        }
                        placeholder="https://facebook.com/..."
                      />
                    </div>
                  </div>

                  <Can permission="venues.edit">
                    <Button
                      onClick={handleSaveVenue}
                      disabled={updateVenue.isPending}
                    >
                      {updateVenue.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {t("saveChanges")}
                    </Button>
                  </Can>
                </fieldset>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Halls Tab ─── */}
        <TabsContent value="halls">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t("halls")}</CardTitle>
                <CardDescription>{t("hallsSubtitle")}</CardDescription>
              </div>
              <Can permission="venues.edit">
                <Button
                  size="sm"
                  className="gap-1.5"
                  disabled={!venueId}
                  onClick={() => setHallDialog({ open: true, hall: null })}
                >
                  <Plus className="h-4 w-4" />
                  {t("addHall")}
                </Button>
              </Can>
            </CardHeader>
            <CardContent>
              {hallsQuery.isPending ? (
                <ListSkeleton />
              ) : (hallsQuery.data?.length ?? 0) === 0 ? (
                <EmptyState message={t("noHalls")} />
              ) : (
                <div className="space-y-3">
                  {hallsQuery.data!.map((hall) => (
                    <div
                      key={hall.id}
                      className="rounded-xl border border-border p-4"
                    >
                      <div className="flex items-start gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold">{hall.name}</p>
                            <Badge
                              variant={hall.is_active ? "success" : "secondary"}
                              className="text-xs"
                            >
                              {hall.is_active ? t("active") : t("inactive")}
                            </Badge>
                          </div>
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            {tCommon("hallSelector")}: {hall.capacity_min ?? 0}–
                            {hall.capacity_max} guests
                          </p>
                          {hall.amenities.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {hall.amenities.map((a) => (
                                <span
                                  key={a}
                                  className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                                >
                                  {a}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <Can
                            permission="venues.edit"
                            fallback={
                              <Switch checked={hall.is_active} disabled />
                            }
                          >
                            <Switch
                              checked={hall.is_active}
                              onCheckedChange={(next) =>
                                handleToggleHallActive(hall, next)
                              }
                            />
                          </Can>
                          <Can permission="venues.edit">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() =>
                                setHallDialog({ open: true, hall })
                              }
                            >
                              <Pencil className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setPendingHallDelete(hall)}
                            >
                              <Trash2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </Can>
                        </div>
                      </div>

                      <EventTypesManager
                        hallId={hall.id}
                        eventTypes={hall.event_record_types ?? []}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Packages Tab ─── */}
        <TabsContent value="packages">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t("packages")}</CardTitle>
                <CardDescription>{t("packagesSubtitle")}</CardDescription>
              </div>
              <Can permission="venues.edit">
                <Button
                  size="sm"
                  className="gap-1.5"
                  disabled={!venueId}
                  onClick={() => setPackageDialog({ open: true, pkg: null })}
                >
                  <Plus className="h-4 w-4" />
                  {t("addPackage")}
                </Button>
              </Can>
            </CardHeader>
            <CardContent>
              {packagesQuery.isPending ? (
                <ListSkeleton />
              ) : (packagesQuery.data?.length ?? 0) === 0 ? (
                <EmptyState message={t("noPackages")} />
              ) : (
                <div className="space-y-3">
                  {packagesQuery.data!.map((pkg) => (
                    <div
                      key={pkg.id}
                      className="flex items-start gap-4 rounded-xl border border-border p-4"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">{pkg.name}</p>
                          <Badge
                            variant={pkg.is_active ? "success" : "secondary"}
                            className="text-xs"
                          >
                            {pkg.is_active ? t("active") : t("inactive")}
                          </Badge>
                          <Badge variant="outline" className="text-xs capitalize">
                            {pkg.price_type === "per_person"
                              ? t("perPerson")
                              : t("flatRate")}
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-sm font-semibold text-primary">
                          {formatCurrency(pkg.base_price)}{" "}
                          <span className="text-xs text-muted-foreground">
                            {pkg.price_type === "per_person"
                              ? `/${t("perPersonShort")}`
                              : t("flatShort")}
                          </span>
                        </p>
                        {pkg.inclusions && (
                          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                            {pkg.inclusions}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <Can
                          permission="venues.edit"
                          fallback={
                            <Switch checked={pkg.is_active} disabled />
                          }
                        >
                          <Switch
                            checked={pkg.is_active}
                            onCheckedChange={(next) =>
                              handleTogglePackageActive(pkg, next)
                            }
                          />
                        </Can>
                        <Can permission="venues.edit">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() =>
                              setPackageDialog({ open: true, pkg })
                            }
                          >
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setPendingPackageDelete(pkg)}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </Can>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── General Tab ─── */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>{t("editPolicy")}</CardTitle>
              <CardDescription>{t("editPolicyDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>{t("editCutoff")}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    className="w-24"
                    min={0}
                    max={180}
                    value={venueForm.edit_cutoff_days}
                    readOnly={!canEditVenue}
                    onChange={(e) =>
                      setVenueForm((v) => ({
                        ...v,
                        edit_cutoff_days: parseInt(e.target.value, 10) || 0,
                      }))
                    }
                  />
                  <span className="text-sm text-muted-foreground">
                    {t("days")}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("editCutoffHelp")}
                </p>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border p-4">
                <div>
                  <p className="text-sm font-medium">{t("managerOverride")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("managerOverrideDesc")}
                  </p>
                </div>
                <Can
                  permission="venues.edit"
                  fallback={
                    <Switch checked={venueForm.edit_cutoff_override} disabled />
                  }
                >
                  <Switch
                    checked={venueForm.edit_cutoff_override}
                    onCheckedChange={(next) =>
                      setVenueForm((v) => ({
                        ...v,
                        edit_cutoff_override: next,
                      }))
                    }
                  />
                </Can>
              </div>

              <Can permission="venues.edit">
                <Button
                  onClick={handleSaveVenue}
                  disabled={updateVenue.isPending || !venueId}
                >
                  {updateVenue.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {t("saveChanges")}
                </Button>
              </Can>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ─── Hall dialog (add + edit) ─── */}
      {venueId && (
        <HallFormDialog
          open={hallDialog.open}
          hall={hallDialog.hall}
          venueId={venueId}
          onClose={() => setHallDialog({ open: false, hall: null })}
        />
      )}

      {/* ─── Package dialog (add + edit) ─── */}
      {venueId && (
        <PackageFormDialog
          open={packageDialog.open}
          pkg={packageDialog.pkg}
          venueId={venueId}
          onClose={() => setPackageDialog({ open: false, pkg: null })}
        />
      )}

      {/* ─── Delete-hall confirmation ─── */}
      <AlertDialog
        open={!!pendingHallDelete}
        onOpenChange={(o) => !o && setPendingHallDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirmDeleteHall")}</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingHallDelete?.name ? `"${pendingHallDelete.name}" — ` : ""}
              {t("confirmDeleteHallDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteHall}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {tCommon("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Delete-package confirmation ─── */}
      <AlertDialog
        open={!!pendingPackageDelete}
        onOpenChange={(o) => !o && setPendingPackageDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirmDeletePackage")}</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingPackageDelete?.name
                ? `"${pendingPackageDelete.name}" — `
                : ""}
              {t("confirmDeletePackageDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeletePackage}
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

// ─── Helper micro-components ──────────────────────────────────────────────────

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-20 animate-pulse rounded-xl border border-border bg-muted/40"
        />
      ))}
    </div>
  );
}

function SettingsFormSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-3 w-24 animate-pulse rounded bg-muted/60" />
          <div className="h-10 animate-pulse rounded-xl bg-muted/40" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-10 text-sm text-muted-foreground">
      {message}
    </div>
  );
}
