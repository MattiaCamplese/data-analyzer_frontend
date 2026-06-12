import { Bell, LogOut, Trash2, Sun, Moon } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useRef, useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RiShieldCheckLine, RiDashboardLine } from "@remixicon/react";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/features/auth/auth.store";
import { useNotificationsStore } from "@/features/notifications/notifications.store";
import { useTheme } from "@/components/theme-provider";
import { AppBreadcrumbs } from "@/components/shell/app-breadcrumbs";
import type { SecurityReport } from "@/types/report";

function useBreadcrumb() {
  const { pathname } = useLocation();
  if (pathname.startsWith("/report/")) {
    return { title: "Report di Sicurezza", icon: <RiShieldCheckLine /> };
  }
  return { title: "Dashboard", icon: <RiDashboardLine /> };
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "adesso";
  if (diff < 3600) return `${Math.floor(diff / 60)} min fa`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ore fa`;
  return `${Math.floor(diff / 86400)} giorni fa`;
}

export function AppHeader() {
  const page = useBreadcrumb();
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const notifications = useNotificationsStore((s) => s.notifications);
  const markAllRead = useNotificationsStore((s) => s.markAllRead);
  const clear = useNotificationsStore((s) => s.clear);

  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function handleOpenBell() {
    setOpen((o) => !o);
    if (!open && unreadCount > 0) markAllRead();
  }

  function handleNotificationClick(domainName: string) {
    const cached = queryClient.getQueryData<{ items: SecurityReport[] }>(["reports", ""]);
    const report = cached?.items.find((r) => r.domain_name === domainName);
    if (report) {
      navigate(`/report/${report.idsummary}`);
      setOpen(false);
    }
  }

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
        {/* Theme toggle */}
        <button
          className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          title={isDark ? "Passa a tema chiaro" : "Passa a tema scuro"}
          onClick={() => setTheme(isDark ? "light" : "dark")}
        >
          {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>

        {/* Bell */}
        <div className="relative" ref={dropdownRef}>
          <button
            className="relative inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            title="Notifiche"
            onClick={handleOpenBell}
          >
            <Bell className="size-4" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 top-10 z-50 w-80 rounded-lg border bg-popover shadow-lg text-popover-foreground">
              <div className="flex items-center justify-between border-b px-4 py-2.5">
                <span className="text-sm font-semibold">Notifiche</span>
                {notifications.length > 0 && (
                  <button
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                    onClick={clear}
                  >
                    <Trash2 className="size-3" />
                    Cancella tutto
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  Nessuna notifica
                </div>
              ) : (
                <ul className="max-h-80 overflow-y-auto divide-y">
                  {notifications.map((n, idx) => (
                    <li
                      key={n.id}
                      className="flex cursor-pointer gap-3 px-4 py-3 text-sm transition-colors hover:bg-muted/50"
                      onClick={() => n.domains[0] && handleNotificationClick(n.domains[0])}
                    >
                      <div className="shrink-0">
                        <span className={`inline-flex size-5 items-center justify-center rounded-full text-[10px] font-bold ${n.read ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground"}`}>
                          {notifications.length - idx}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium leading-snug">Nuovo dominio caricato</p>
                        {n.domains[0] && (
                          <p className="mt-0.5 truncate text-xs text-primary hover:underline">
                            {n.domains[0]}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-muted-foreground">{timeAgo(n.timestamp)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Logout */}
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
