import { UsersContent } from "./users-content";
import { RouteGuard } from "@/components/auth/route-guard";

export default function UsersPage() {
  return (
    <RouteGuard permission="users.view">
      <UsersContent />
    </RouteGuard>
  );
}
