import { useAuthStore } from "@/features/auth/auth.store"

export const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? ""

let refreshPromise: Promise<boolean> | null = null

async function refreshTokens(): Promise<boolean> {
  const { refreshToken } = useAuthStore.getState()
  if (!refreshToken) return false

  try {
    const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    })
    if (!res.ok) return false

    const { accessToken, refreshToken: newRefreshToken } = await res.json()
    useAuthStore.getState().setTokens(accessToken, newRefreshToken)
    return true
  } catch {
    return false
  }
}

function forceLogout() {
  useAuthStore.getState().logout()
  window.location.href = "/login"
}

function withAuth(token: string, options: RequestInit): RequestInit {
  return { ...options, headers: { ...options.headers, Authorization: `Bearer ${token}` } }
}

/** Fetch autenticato: allega l'access token e, su 401, tenta un refresh silenzioso
 *  con retry automatico. Se il refresh fallisce, fa logout e reindirizza al login.
 *  `path` può essere relativo (viene anteposto BASE_URL) oppure già una URL assoluta. */
export async function authFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const url = path.startsWith("http") ? path : `${BASE_URL}${path}`
  const { accessToken } = useAuthStore.getState()
  let res = await fetch(url, withAuth(accessToken, options))

  if (res.status === 401) {
    refreshPromise ??= refreshTokens().finally(() => {
      refreshPromise = null
    })
    const refreshed = await refreshPromise

    if (!refreshed) {
      forceLogout()
      throw new Error("Sessione scaduta, effettua nuovamente il login")
    }

    res = await fetch(url, withAuth(useAuthStore.getState().accessToken, options))
    if (res.status === 401) {
      forceLogout()
      throw new Error("Sessione scaduta, effettua nuovamente il login")
    }
  }

  return res
}
