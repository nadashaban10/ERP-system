"use client";

import { useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { can } from "@/lib/utils/permissions";
import { useMyProfile } from "@/lib/auth/use-my-profile";
import { hasPermission } from "@/lib/auth/my-profile";
import { CreateUserDialog } from "@/features/users";
import { useAgents, type AgentProfileRow } from "@/lib/queries/useUserManagement";
import {
  AgentStatusBadge,
  DeactivateUserDialog,
  EditAgentVenuesSheet,
} from "@/components/user-management";

export function UsersContent() {
  const t = useTranslations("users");
  const locale = useLocale();
  const { data: profile, isLoading: profileLoading } = useMyProfile();

  const [createOpen, setCreateOpen] = useState(false);
  const [editVenuesAgent, setEditVenuesAgent] = useState<AgentProfileRow | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<AgentProfileRow | null>(null);

  const isSuperAdmin = profile?.role === "super_admin";
  const isOwner = profile?.role === "owner";
  const canShowUserUi = isSuperAdmin || isOwner;

  const agentsQuery = useAgents(
    profile?.user_id ?? null,
    isSuperAdmin ? { listAllAgents: true } : undefined
  );

  const agents = agentsQuery.data ?? [];
  const callerVenues = useMemo(
    () =>
      (profile?.venues ?? []).map((v) => ({
        id: v.id,
        name_en: v.name_en,
      })),
    [profile?.venues]
  );

  const canEdit = profile ? can(profile.permissions, "users", "edit") : false;
  const canCreateUsers = profile ? hasPermission(profile, "users.create") : false;

  if (profileLoading) {
    return (
      <div className="flex min-h-[280px] items-center justify-center text-sm text-muted-foreground">
        {t("loadingAgents")}
      </div>
    );
  }

  if (!profile || !canShowUserUi) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">
            {t("emptyAgents")}
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentVenueIdsForSheet =
    editVenuesAgent?.user_venues?.map((v) => v.venue_id) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("agentsTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("agentsSubtitle")}</p>
        </div>
        {canCreateUsers && (
          <Button className="gap-2" onClick={() => setCreateOpen(true)}>
            <UserPlus className="h-4 w-4" aria-hidden />
            {t("createUserButton")}
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {agentsQuery.isLoading ? (
            <p className="p-6 text-sm text-muted-foreground">{t("loadingAgents")}</p>
          ) : agents.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">{t("emptyAgents")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left">
                    <th className="px-4 py-3 font-medium">{t("colFullName")}</th>
                    <th className="px-4 py-3 font-medium">{t("colEmail")}</th>
                    <th className="px-4 py-3 font-medium">{t("colStatus")}</th>
                    <th className="px-4 py-3 font-medium">{t("colVenues")}</th>
                    <th className="px-4 py-3 font-medium">{t("colCreated")}</th>
                    {canEdit && (
                      <th className="px-4 py-3 font-medium text-right">{t("colActions")}</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {agents.map((row) => (
                    <tr key={row.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 font-medium">{row.full_name || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.email}</td>
                      <td className="px-4 py-3">
                        <AgentStatusBadge status={row.status} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[220px]">
                        {row.user_venues
                          ?.map((uv) => uv.venues?.name_en)
                          .filter(Boolean)
                          .join(", ") || "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {row.created_at
                          ? formatDate(row.created_at, locale === "ar" ? "ar" : "en")
                          : "—"}
                      </td>
                      {canEdit && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setEditVenuesAgent(row)}
                            >
                              {t("editVenues")}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setDeactivateTarget(row)}
                            >
                              {String(row.status).toLowerCase() === "active"
                                ? t("deactivateUser")
                                : t("activateUser")}
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {profile && canCreateUsers && (
        <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} profile={profile} />
      )}

      <EditAgentVenuesSheet
        open={!!editVenuesAgent}
        onOpenChange={(v) => {
          if (!v) setEditVenuesAgent(null);
        }}
        agent={
          editVenuesAgent
            ? { id: editVenuesAgent.id, full_name: editVenuesAgent.full_name ?? "" }
            : null
        }
        callerRole={isSuperAdmin ? "super_admin" : "owner"}
        callerVenues={callerVenues}
        currentVenueIds={currentVenueIdsForSheet}
      />

      <DeactivateUserDialog
        open={!!deactivateTarget}
        onOpenChange={(v) => {
          if (!v) setDeactivateTarget(null);
        }}
        user={
          deactivateTarget
            ? {
                id: deactivateTarget.id,
                full_name: deactivateTarget.full_name ?? "",
                status: deactivateTarget.status,
              }
            : null
        }
      />
    </div>
  );
}
