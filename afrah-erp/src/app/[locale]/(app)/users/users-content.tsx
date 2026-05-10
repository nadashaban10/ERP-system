"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  Mail,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Can } from "@/components/auth/can";
import { useMyProfile } from "@/lib/auth/use-my-profile";
import { hasPermission } from "@/lib/auth/my-profile";
import { useVenueUsersList } from "@/lib/queries/venue-users";
import { formatDate } from "@/lib/utils";
import { toast } from "@/components/ui/toaster";

export function UsersContent() {
  const t = useTranslations("users");
  const tc = useTranslations("common");
  const locale = useLocale();
  const { data: profile, isLoading } = useMyProfile();
  const { data: venueUsers = [], isLoading: teamLoading } = useVenueUsersList();
  const [inviteOpen, setInviteOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-sm text-muted-foreground">{tc("loading")}</p>
      </div>
    );
  }

  if (!hasPermission(profile, "users.view")) {
    return (
      <Card className="max-w-md mx-auto mt-12">
        <CardContent className="flex flex-col items-center text-center p-8">
          <div className="rounded-2xl p-4 bg-red-100 text-red-600 mb-4">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold mb-2">{t("accessDeniedTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("accessDeniedDesc")}</p>
        </CardContent>
      </Card>
    );
  }

  const snippet = `INSERT INTO venue_users (venue_id, user_id, role)\nVALUES ('<venue_uuid>', '<user_uuid>', 'viewer');`;

  async function copyUserId(id: string) {
    try {
      await navigator.clipboard.writeText(id);
      toast({
        variant: "success",
        title: t("clipboardCopiedTitle"),
      });
    } catch {
      toast({
        variant: "destructive",
        title: t("clipboardFailedTitle"),
        description: id,
      });
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Can permission="users.create">
          <Button type="button" className="gap-2" onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-4 w-4" />
            {t("inviteButton")}
          </Button>
        </Can>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            {t("youCardTitle")}
          </CardTitle>
          <CardDescription>{t("youCardDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-bold text-lg">
              {(profile?.full_name ?? profile?.email ?? "U")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold">{profile?.full_name ?? "—"}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Mail className="h-3 w-3" />
                {profile?.email}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant="info" className="text-xs">
                  {profile?.role}
                </Badge>
                <Badge
                  variant={profile?.status === "active" ? "success" : "secondary"}
                  className="text-xs"
                >
                  {profile?.status}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            {t("permissionsCardTitle")}
          </CardTitle>
          <CardDescription>{t("yourPermissionsDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          {profile?.permissions?.length ? (
            <div className="flex flex-wrap gap-2">
              {profile.permissions.map((p) => (
                <Badge key={p} variant="outline" className="text-xs font-mono">
                  {p}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("noPermissionsAssigned")}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>{t("teamTitle")}</CardTitle>
            <CardDescription>{t("teamDesc")}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">{t("noEmailNote")}</p>
          {teamLoading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">{t("loadingTeam")}</p>
          ) : venueUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center border border-dashed rounded-xl">
              {t("emptyTeam")}
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-xl border">
              {venueUsers.map((row) => {
                const isYou = profile?.id === row.user_id;
                return (
                  <li key={row.id} className="flex flex-col sm:flex-row sm:items-center gap-2 p-4">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs break-all">{row.user_id}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0"
                          aria-label={t("copyUserIdAria")}
                          onClick={() => void copyUserId(row.user_id)}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        {isYou && (
                          <Badge variant="secondary" className="text-[10px]">
                            {t("youBadge")}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline">{row.role}</Badge>
                        <span>
                          {t("addedAt")}: {formatDate(row.created_at, locale)}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("inviteHintTitle")}</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3 text-sm">
                <p>{t("inviteHintStep1")}</p>
                <p>{t("inviteHintStep2")}</p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <pre className="rounded-lg bg-muted p-3 text-xs overflow-x-auto font-mono">
            {snippet}
          </pre>
          <p className="text-xs text-muted-foreground">{t("inviteHintFooter")}</p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>
              {t("closeInvite")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
