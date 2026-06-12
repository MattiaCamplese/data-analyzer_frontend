import { Outlet } from "react-router-dom";
import { AppShell } from "@/components/shell/app-shell";

const AppLayout = () => {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
};

export default AppLayout;
