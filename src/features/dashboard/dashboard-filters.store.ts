import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

interface DashboardFiltersState {
  dateFilter: string
  setDateFilter: (date: string) => void
  clearDateFilter: () => void
}

export const useDashboardFilters = create<DashboardFiltersState>()(
  persist(
    (set) => ({
      dateFilter: "",
      setDateFilter: (date) => set({ dateFilter: date }),
      clearDateFilter: () => set({ dateFilter: "" }),
    }),
    {
      name: "da-dashboard-filters",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)
