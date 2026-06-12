import type { ReactNode } from "react";
import { RiDashboardLine, RiShieldCheckLine, RiSettings3Line, RiQuestionLine } from "@remixicon/react";

export type SidebarNavItem = {
  title: string;
  path?: string;
  icon?: ReactNode;
  isActive?: boolean;
  subItems?: SidebarNavItem[];
};

export type SidebarNavGroup = {
  label?: string;
  items: SidebarNavItem[];
};

export const navGroups: SidebarNavGroup[] = [
  {
    items: [
      {
        title: "Dashboard",
        path: "/",
        icon: <RiDashboardLine />,
        isActive: true,
      },
    ],
  },
  {
    label: "Analisi",
    items: [
      {
        title: "Report",
        path: "/",
        icon: <RiShieldCheckLine />,
      },
    ],
  },
  {
    label: "Impostazioni",
    items: [
      {
        title: "Configurazione",
        path: "#/settings",
        icon: <RiSettings3Line />,
        subItems: [
          { title: "API Backend", path: "#/settings/api" },
          { title: "Notifiche", path: "#/settings/notifications" },
        ],
      },
    ],
  },
];

export const footerNavLinks: SidebarNavItem[] = [
  {
    title: "Documentazione",
    path: "#/docs",
    icon: <RiQuestionLine />,
  },
];

export const navLinks: SidebarNavItem[] = [
  ...navGroups.flatMap((group) =>
    group.items.flatMap((item) =>
      item.subItems?.length ? [item, ...item.subItems] : [item],
    ),
  ),
  ...footerNavLinks,
];
