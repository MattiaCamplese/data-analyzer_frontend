import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import { RouterProvider, createBrowserRouter } from "react-router-dom"
import { QueryClientProvider, QueryClient } from "@tanstack/react-query"
import { Toaster } from "sonner"
import { ThemeProvider } from "@/components/theme-provider.tsx"
import Layout from "./layout/layout"
import HomePage from "./pages/home-page"

const client = new QueryClient()

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <HomePage />
      },
    ]
  }
])

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={client}>
        <RouterProvider router={router} />
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>
)