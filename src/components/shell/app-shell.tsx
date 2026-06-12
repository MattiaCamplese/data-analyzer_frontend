import { AppHeader } from "@/components/shell/app-header";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh flex flex-col bg-background">
      <AppHeader />
      <main className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 md:p-6">
        {children}
      </main>
    </div>
  );
}
