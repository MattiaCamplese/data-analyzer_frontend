import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { User } from "@/types/user"

type AuthStore = {
  user: User | undefined
  accessToken: string
  refreshToken: string
  login: (user: User, accessToken: string, refreshToken: string) => void
  setTokens: (accessToken: string, refreshToken: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: undefined,
      accessToken: "",
      refreshToken: "",
      login(user, accessToken, refreshToken) {
        set({ user, accessToken, refreshToken })
      },
      setTokens(accessToken, refreshToken) {
        set({ accessToken, refreshToken })
      },
      logout() {
        set({ user: undefined, accessToken: "", refreshToken: "" })
      },
    }),
    {
      name: "auth",
      storage: createJSONStorage(() => localStorage),
    }
  )
)
