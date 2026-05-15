"use client";

import { Suspense, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { VenueSelectionProvider } from "@/lib/auth/venue-selection-context";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <Suspense fallback={null}>
      <VenueSelectionProvider>
        <div className="flex h-screen overflow-hidden bg-background">
          <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

          <div className="flex flex-1 flex-col lg:ml-60 min-w-0 overflow-hidden">
            <Topbar onMenuToggle={() => setSidebarOpen(true)} />
            <main className="flex-1 overflow-y-auto">
              <div className="p-4 lg:p-6 max-w-[1400px] mx-auto">{children}</div>
            </main>
          </div>
        </div>
      </VenueSelectionProvider>
    </Suspense>
  );
}

