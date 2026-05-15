"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useDeactivateUser, useReactivateUser } from "@/lib/queries/useUserManagement";

export interface DeactivateUserDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  user: { id: string; full_name: string; status: string } | null;
}

export function DeactivateUserDialog({
  open,
  onOpenChange,
  user,
}: DeactivateUserDialogProps) {
  const [reason, setReason] = useState("");
  const deactivate = useDeactivateUser();
  const reactivate = useReactivateUser();

  const status = user ? String(user.status).toLowerCase() : "";
  const isActive = status === "active";

  useEffect(() => {
    if (!open) {
      setReason("");
    }
  }, [open]);

  if (!user) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          {isActive ? (
            <>
              <AlertDialogTitle>Deactivate {user.full_name}?</AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <span className="block text-left">
                  This user will immediately lose access to the system. Their bookings and inquiry
                  history will be preserved.
                </span>
                <Textarea
                  placeholder="Reason (optional)"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </AlertDialogDescription>
            </>
          ) : (
            <>
              <AlertDialogTitle>Reactivate {user.full_name}?</AlertDialogTitle>
              <AlertDialogDescription className="text-left">
                This user will regain access to the system.
              </AlertDialogDescription>
            </>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
          {isActive ? (
            <Button
              type="button"
              variant="destructive"
              disabled={deactivate.isPending}
              onClick={() =>
                deactivate.mutate(
                  { userId: user.id, reason: reason.trim() || undefined },
                  {
                    onSuccess: () => {
                      onOpenChange(false);
                      setReason("");
                    },
                  }
                )
              }
            >
              {deactivate.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              )}
              Deactivate
            </Button>
          ) : (
            <Button
              type="button"
              variant="success"
              disabled={reactivate.isPending}
              onClick={() =>
                reactivate.mutate(user.id, {
                  onSuccess: () => onOpenChange(false),
                })
              }
            >
              {reactivate.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              )}
              Reactivate
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
