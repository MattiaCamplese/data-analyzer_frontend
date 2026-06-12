import type { SecurityReport } from "@/types/report"
import { mockReports } from "./mock-data"
import { useAuthStore } from "@/features/auth/auth.store"

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? ""
export const isMock = !BASE_URL

function authHeader(): HeadersInit {
  const token = useAuthStore.getState().token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// ── Lista report ───────────────────────────────────────────
export async function fetchReports(params?: {
  search?: string
  page?: number
  perPage?: number
  latest?: boolean
}): Promise<{ items: SecurityReport[]; totalItems: number; totalPages: number }> {
  if (isMock) {
    // Count scans per domain
    const countByDomain = new Map<string, number>()
    for (const r of mockReports) {
      countByDomain.set(r.domain_name, (countByDomain.get(r.domain_name) ?? 0) + 1)
    }
    // Deduplicate by domain_name, keep latest creation_date
    const byDomain = new Map<string, SecurityReport>()
    for (const r of mockReports) {
      const existing = byDomain.get(r.domain_name)
      if (!existing || r.creation_date > existing.creation_date) byDomain.set(r.domain_name, r)
    }
    let items = Array.from(byDomain.values()).map((r) => ({
      ...r,
      scan_count: countByDomain.get(r.domain_name) ?? 1,
    }))
    if (params?.search) {
      items = items.filter((r) =>
        r.domain_name.toLowerCase().includes(params.search!.toLowerCase()),
      )
    }
    return { items, totalItems: items.length, totalPages: 1 }
  }

  const url = new URL(`${BASE_URL}/api/summaries`)
  url.searchParams.set("latest", String(params?.latest ?? true))
  if (params?.search)   url.searchParams.set("search",  params.search)
  if (params?.page)     url.searchParams.set("page",    String(params.page))
  if (params?.perPage)  url.searchParams.set("perPage", String(params.perPage))

  const res = await fetch(url.toString(), { headers: authHeader() })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// ── Storico scansioni per dominio ──────────────────────────
export async function fetchReportHistory(domain: string): Promise<{ items: SecurityReport[]; total: number }> {
  if (isMock) {
    const items = mockReports.filter((r) => r.domain_name === domain)
      .sort((a, b) => b.creation_date.localeCompare(a.creation_date))
    return { items, total: items.length }
  }
  const res = await fetch(
    `${BASE_URL}/api/summaries/history/${encodeURIComponent(domain)}`,
    { headers: authHeader() },
  )
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// ── Singolo report ─────────────────────────────────────────
export async function fetchReport(id: string): Promise<SecurityReport> {
  if (isMock) {
    const report = mockReports.find((r) => r.idsummary === id || r.domain_name === id)
    if (!report) throw new Error(`Report "${id}" not found`)
    return report
  }

  const res = await fetch(`${BASE_URL}/api/summaries/${id}`, { headers: authHeader() })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// ── Upload JSON ────────────────────────────────────────────
export async function uploadReports(data: unknown): Promise<{ inserted: number }> {
  if (isMock) {
    return { inserted: Array.isArray(data) ? (data as unknown[]).length : 1 }
  }
  const res = await fetch(`${BASE_URL}/api/summaries`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.message ?? `HTTP ${res.status}`)
  }
  return res.json()
}

// ── Elimina report ─────────────────────────────────────────
export async function deleteReport(id: string): Promise<void> {
  if (isMock) return
  const res = await fetch(`${BASE_URL}/api/summaries/${id}`, {
    method: "DELETE",
    headers: authHeader(),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.message ?? `HTTP ${res.status}`)
  }
}

// ── Seed (utility) ─────────────────────────────────────────
export async function seedDatabase(): Promise<void> {
  if (isMock) return
  const res = await fetch(`${BASE_URL}/api/summaries/seed`, {
    method: "POST",
    headers: authHeader(),
  })
  if (!res.ok) throw new Error(`Seed failed: HTTP ${res.status}`)
}
