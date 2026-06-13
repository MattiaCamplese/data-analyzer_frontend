import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import { RouterProvider, createBrowserRouter } from "react-router-dom"
import { QueryClientProvider, QueryClient } from "@tanstack/react-query"
import { Toaster } from "sonner"
import { ThemeProvider } from "@/components/theme-provider.tsx"
import { TooltipProvider } from "@/components/ui/tooltip"
import AppLayout from "./layout/app-layout"
import DashboardPage from "./pages/dashboard-page"
import ReportPage from "./pages/report-page"
import ComparePage from "./pages/compare-page"
import LoginPage from "./pages/login-page"
import NotFoundPage from "./pages/not-found-page"
import ProtectedRoute from "./components/shell/protected-route"

const client = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: <DashboardPage />,
          },
          {
            path: "/report/:id",
            element: <ReportPage />,
          },
          {
            path: "/compare/:domain",
            element: <ComparePage />,
          },
          {
            path: "*",
            element: <NotFoundPage />,
          },
        ],
      },
    ],
  },
])

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="dark">
      <TooltipProvider>
        <QueryClientProvider client={client}>
          <RouterProvider router={router} />
          <Toaster />
        </QueryClientProvider>
      </TooltipProvider>
    </ThemeProvider>
  </StrictMode>
)