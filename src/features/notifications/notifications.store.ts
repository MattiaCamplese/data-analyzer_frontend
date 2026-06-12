import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

export interface AppNotification {
  id: string
  domains: string[]
  count: number
  timestamp: string
  read: boolean
}

interface NotificationsStore {
  notifications: AppNotification[]
  add: (payload: { domains: string[]; count: number }) => void
  markAllRead: () => void
  clear: () => void
}

export const useNotificationsStore = create<NotificationsStore>()(
  persist(
    (set) => ({
      notifications: [],
      add({ domains, count }) {
        set((s) => ({
          notifications: [
            {
              id: crypto.randomUUID(),
              domains,
              count,
              timestamp: new Date().toISOString(),
              read: false,
            },
            ...s.notifications,
          ],
        }))
      },
      markAllRead() {
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, read: true })),
        }))
      },
      clear() {
        set({ notifications: [] })
      },
    }),
    { name: "notifications", storage: createJSONStorage(() => localStorage) },
  ),
)
