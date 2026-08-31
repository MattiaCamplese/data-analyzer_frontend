import type { User } from "@/types/user"
import { useAuthStore } from "./auth.store"
import { authFetch, BASE_URL } from "@/lib/http"

async function publicFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  })
  const body = await res.json().catch(() => null)
  if (!res.ok) throw new Error(body?.message ?? `HTTP ${res.status}`)
  return body as T
}

export const AuthService = {
  async login(email: string, password: string): Promise<void> {
    const { accessToken, refreshToken, user } = await publicFetch<{
      accessToken: string
      refreshToken: string
      user: User
    }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
    useAuthStore.getState().login(user, accessToken, refreshToken)
  },

  async me(): Promise<User> {
    const res = await authFetch("/api/auth/me")
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
  },

  async logout(): Promise<void> {
    const { refreshToken } = useAuthStore.getState()
    if (refreshToken) {
      await fetch(`${BASE_URL}/api/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      }).catch(() => {})
    }
    useAuthStore.getState().logout()
  },
}
