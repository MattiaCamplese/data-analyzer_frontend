import { Bell, LogOut } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { RiShieldCheckLine, RiDashboardLine } from "@remixicon/react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/features/auth/auth.store";
import { AppBreadcrumbs } from "@/components/shell/app-breadcrumbs";

function useBreadcrumb() {
  const { pathname } = useLocation();
  if (pathname.startsWith("/report/")) {
    return { title: "Report di Sicurezza", icon: <RiShieldCheckLine /> };
  }
  return { title: "Dashboard", icon: <RiDashboardLine /> };
}

export function AppHeader() {
  const page = useBreadcrumb();
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between border-b bg-background px-4 md:px-6">
      {/* Left: logo + breadcrumb */}
      <div className="flex items-center gap-3">
        <a href="/" className="flex items-center gap-2 text-sm font-semibold">
          <RiShieldCheckLine className="size-5 text-primary" />
          <span className="hidden sm:inline">SecureAnalyzer</span>
        </a>
        <Separator orientation="vertical" className="h-4 data-[orientation=vertical]:self-center" />
        <AppBreadcrumbs page={page} />
      </div>

      {/* Right: notifications + logout */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground"
          title="Notifiche"
        >
          <Bell className="size-4" />
        </Button>
        <button
          className="inline-flex size-8 items-center justify-center rounded-md text-destructive transition-colors hover:bg-destructive/10"
          title="Esci"
          onClick={handleLogout}
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </header>
  );
}
