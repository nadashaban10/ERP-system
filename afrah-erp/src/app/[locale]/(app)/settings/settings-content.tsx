"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Loader2, Plus, Trash2, Building2, LayoutGrid, Package, CalendarDays, Users } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { MOCK_VENUE, MOCK_HALLS, MOCK_PACKAGES } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import { toast } from "@/components/ui/toaster";
import { useMyProfile } from "@/lib/auth/use-my-profile";
import { hasPermission } from "@/lib/auth/my-profile";
import { Can } from "@/components/auth/can";

export function SettingsContent() {
  const t = useTranslations("settings");
  const locale = useLocale();
  const [isSaving, setIsSaving] = useState(false);
  const { data: profile } = useMyProfile();

  const canEditVenue = hasPermission(profile, "venues.edit");
  const canViewVenue = hasPermission(profile, "venues.view");
  const canManageBilling = hasPermission(profile, "billing.manage");

  const [venue, setVenue] = useState({ ...MOCK_VENUE });

  async function handleSaveVenue() {
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    // TODO: supabase.from("venues").update(venue).eq("id", venue.id)
    toast({ variant: "success", title: "Venue settings saved" });
    setIsSaving(false);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">
          Configure your venue profile, halls, and packages
        </p>
      </div>

      <Tabs defaultValue={canViewVenue ? "venue" : canManageBilling ? "billing" : "general"}>
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
              <Package className="h-4 w-4" />
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
              Billing
            </TabsTrigger>
          )}
        </TabsList>

        {/* ─── Venue Tab ─── */}
        <TabsContent value="venue">
          <Card>
            <CardHeader>
              <CardTitle>{t("venue")}</CardTitle>
              <CardDescription>Your venue profile and contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>{t("venueName")}</Label>
                  <Input
                    value={venue.name_ar}
                    onChange={(e) =>
                      setVenue((v) => ({ ...v, name_ar: e.target.value }))
                    }
                    dir="rtl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("venueNameEn")}</Label>
                  <Input
                    value={venue.name_en}
                    onChange={(e) =>
                      setVenue((v) => ({ ...v, name_en: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("venueType")}</Label>
                  <Select
                    value={venue.type}
                    onValueChange={(v: typeof venue.type) =>
                      setVenue((vn) => ({ ...vn, type: v }))
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
                    value={venue.city}
                    onValueChange={(v: typeof venue.city) =>
                      setVenue((vn) => ({ ...vn, city: v }))
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
                    value={venue.address}
                    onChange={(e) =>
                      setVenue((v) => ({ ...v, address: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Primary Phone</Label>
                  <Input
                    value={venue.phone_1}
                    onChange={(e) =>
                      setVenue((v) => ({ ...v, phone_1: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Secondary Phone</Label>
                  <Input
                    value={venue.phone_2 ?? ""}
                    onChange={(e) =>
                      setVenue((v) => ({ ...v, phone_2: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Instagram URL</Label>
                  <Input
                    value={venue.instagram ?? ""}
                    onChange={(e) =>
                      setVenue((v) => ({ ...v, instagram: e.target.value }))
                    }
                    placeholder="https://instagram.com/..."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Facebook URL</Label>
                  <Input
                    value={venue.facebook ?? ""}
                    onChange={(e) =>
                      setVenue((v) => ({ ...v, facebook: e.target.value }))
                    }
                    placeholder="https://facebook.com/..."
                  />
                </div>
              </div>

              <Can permission="venues.edit">
                <Button onClick={handleSaveVenue} disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("saveChanges")}
                </Button>
              </Can>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Halls Tab ─── */}
        <TabsContent value="halls">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t("halls")}</CardTitle>
                <CardDescription>
                  Manage your venue&apos;s halls and spaces
                </CardDescription>
              </div>
              <Can permission="venues.edit">
                <Button size="sm" className="gap-1.5">
                  <Plus className="h-4 w-4" />
                  {t("addHall")}
                </Button>
              </Can>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {MOCK_HALLS.map((hall) => (
                  <div
                    key={hall.id}
                    className="flex items-start gap-4 rounded-xl border border-border p-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold">{hall.name}</p>
                        <Badge
                          variant={hall.is_active ? "success" : "secondary"}
                          className="text-xs"
                        >
                          {hall.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        Capacity: {hall.capacity_min ?? 0}–{hall.capacity_max} guests
                      </p>
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
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Can permission="venues.edit" fallback={<Switch defaultChecked={hall.is_active} disabled />}>
                        <Switch defaultChecked={hall.is_active} />
                      </Can>
                      <Can permission="venues.edit">
                        <Button variant="ghost" size="icon-sm">
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </Can>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Packages Tab ─── */}
        <TabsContent value="packages">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t("packages")}</CardTitle>
                <CardDescription>Define pricing packages for bookings</CardDescription>
              </div>
              <Can permission="venues.edit">
                <Button size="sm" className="gap-1.5">
                  <Plus className="h-4 w-4" />
                  {t("addPackage")}
                </Button>
              </Can>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {MOCK_PACKAGES.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="flex items-start gap-4 rounded-xl border border-border p-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold">{pkg.name}</p>
                        <Badge
                          variant={pkg.is_active ? "success" : "secondary"}
                          className="text-xs"
                        >
                          {pkg.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="outline" className="text-xs capitalize">
                          {pkg.price_type.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-sm font-semibold text-primary">
                        {formatCurrency(pkg.base_price)}{" "}
                        {pkg.price_type === "per_person" ? "/person" : "flat"}
                      </p>
                      {pkg.inclusions && (
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                          {pkg.inclusions}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Can permission="venues.edit" fallback={<Switch defaultChecked={pkg.is_active} disabled />}>
                        <Switch defaultChecked={pkg.is_active} />
                      </Can>
                      <Can permission="venues.edit">
                        <Button variant="ghost" size="icon-sm">
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </Can>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── General Tab ─── */}
        <TabsContent value="general">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Edit Policy</CardTitle>
                <CardDescription>
                  Control when bookings can be edited
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>{t("editCutoff")}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      defaultValue={30}
                      className="w-24"
                      min={0}
                      max={180}
                    />
                    <span className="text-sm text-muted-foreground">days</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Bookings cannot be edited within this many days of the event date
                  </p>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border p-4">
                  <div>
                    <p className="text-sm font-medium">Manager Override</p>
                    <p className="text-xs text-muted-foreground">
                      Allow managers to bypass the edit cutoff
                    </p>
                  </div>
                  <Switch defaultChecked={venue.edit_cutoff_override} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Supabase Connection</CardTitle>
                <CardDescription>
                  Configure your database connection
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
                  <p className="font-semibold mb-1">⚠ Supabase Not Connected</p>
                  <p>
                    The app is currently running with mock data. To connect to
                    your Supabase project, add your credentials to{" "}
                    <code className="bg-amber-100 px-1 rounded">.env.local</code>
                    :
                  </p>
                  <pre className="mt-2 text-xs bg-amber-100 rounded p-2 overflow-auto">
                    {`NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co\nNEXT_PUBLIC_SUPABASE_ANON_KEY=your-key`}
                  </pre>
                </div>
                <div className="space-y-1.5">
                  <Label>Supabase URL</Label>
                  <Input
                    placeholder="https://your-project-ref.supabase.co"
                    disabled
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Anon Key</Label>
                  <Input
                    type="password"
                    placeholder="Configure in .env.local"
                    disabled
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
