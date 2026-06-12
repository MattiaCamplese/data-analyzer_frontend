import type { User } from "@/types/user"
import { useAuthStore } from "./auth.store"

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? ""

async function authFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
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
    const { token, user } = await authFetch<{ token: string; user: User }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
    useAuthStore.getState().login(user, token)
  },

  async me(): Promise<User> {
    const token = useAuthStore.getState().token
    return authFetch<User>("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
  },
}
