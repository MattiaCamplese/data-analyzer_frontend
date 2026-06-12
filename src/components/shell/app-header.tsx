"use client";

import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { AppBreadcrumbs } from "@/components/shell/app-breadcrumbs";
import { CustomSidebarTrigger } from "@/components/shell/custom-sidebar-trigger";
import { useLocation } from "react-router-dom";
import { RiDashboardLine, RiShieldCheckLine } from "@remixicon/react";

function useBreadcrumb() {
  const { pathname } = useLocation();
  if (pathname.startsWith("/report/")) {
    return { title: "Report di Sicurezza", icon: <RiShieldCheckLine /> };
  }
  return { title: "Dashboard", icon: <RiDashboardLine /> };
}

export function AppHeader() {
  const page = useBreadcrumb();

  return (
    <header
      className={cn(
        "sticky top-0 z-50 flex h-14 shrink-0 items-center gap-2 border-b px-4 md:px-6",
      )}
    >
      <div className="flex items-center gap-3">
        <CustomSidebarTrigger />
        <Separator
          className="mr-2 h-4 data-[orientation=vertical]:self-center"
          orientation="vertical"
        />
        <AppBreadcrumbs page={page} />
      </div>
    </header>
  );
}
