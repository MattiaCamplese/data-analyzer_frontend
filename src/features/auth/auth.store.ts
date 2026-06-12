import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { User } from "@/types/user"

type AuthStore = {
  user: User | undefined
  token: string
  login: (user: User, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: undefined,
      token: "",
      login(user, token) {
        set({ user, token })
      },
      logout() {
        set({ user: undefined, token: "" })
      },
    }),
    {
      name: "auth",
      storage: createJSONStorage(() => localStorage),
    }
  )
)
