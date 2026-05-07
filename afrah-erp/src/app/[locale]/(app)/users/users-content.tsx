"use client";

import { Shield, ShieldAlert, ShieldCheck, UserPlus, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Can } from "@/components/auth/can";
import { useMyProfile } from "@/lib/auth/use-my-profile";
import { hasPermission } from "@/lib/auth/my-profile";

export function UsersContent() {
  const { data: profile, isLoading } = useMyProfile();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-sm text-muted-foreground">Loading…</p>
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
          <h2 className="text-xl font-bold mb-2">Access denied</h2>
          <p className="text-sm text-muted-foreground">
            You don&apos;t have permission to view users.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-sm text-muted-foreground">
            Invite teammates and manage their permissions
          </p>
        </div>
        <Can permission="users.create">
          <Button className="gap-2">
            <UserPlus className="h-4 w-4" />
            Invite user
          </Button>
        </Can>
      </div>

      {/* Current user card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            You
          </CardTitle>
          <CardDescription>Your current account details</CardDescription>
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
                <Badge variant="info" className="text-xs">{profile?.role}</Badge>
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

      {/* Permissions panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Your permissions
          </CardTitle>
          <CardDescription>
            These determine which screens and actions you can access.
          </CardDescription>
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
            <p className="text-sm text-muted-foreground">No permissions assigned.</p>
          )}
        </CardContent>
      </Card>

      {/* Team list (placeholder until you wire the real RPC/table) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Team members</CardTitle>
            <CardDescription>All users in your venue</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <Shield className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Team listing will appear here once we wire the <code>venue_users</code> query.
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Send the RPC name (e.g. <code>list_venue_users</code>) and I&apos;ll connect it.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
