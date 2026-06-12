import { RiShieldCheckLine } from "@remixicon/react";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { NavGroup } from "@/components/shell/nav-group";
import { footerNavLinks, navGroups } from "@/components/shell/app-shared";
import { useAuthStore } from "@/features/auth/auth.store";

export function AppSidebar() {
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader className="h-14 justify-center">
        <SidebarMenuButton asChild>
          <a href="/">
            <RiShieldCheckLine />
            <span className="font-semibold">Data-Analyzer</span>
          </a>
        </SidebarMenuButton>
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((group, index) => (
          <NavGroup key={`sidebar-group-${index}`} {...group} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          {footerNavLinks.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild className="text-muted-foreground" size="sm">
                <a href={item.path}>
                  {item.icon}
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          <SidebarMenuItem>
            <SidebarMenuButton
              className="text-muted-foreground hover:text-destructive"
              size="sm"
              onClick={handleLogout}
            >
              <LogOut className="size-4" />
              <span>Esci</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
