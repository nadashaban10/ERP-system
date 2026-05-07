"use client";

import { ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function AccessDenied({
  title = "Access denied",
  description = "You don't have permission to view this page.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <Card className="max-w-md mx-auto mt-12">
      <CardContent className="flex flex-col items-center text-center p-8">
        <div className="rounded-2xl p-4 bg-red-100 text-red-600 mb-4">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold mb-2">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
