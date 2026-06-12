import type { SecurityReport } from "@/types/report"
import { mockReports } from "./mock-data"

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? ""
export const isMock = !BASE_URL

// ── Lista report ───────────────────────────────────────────
export async function fetchReports(params?: {
  search?: string
  page?: number
  perPage?: number
}): Promise<{ items: SecurityReport[]; totalItems: number; totalPages: number }> {
  if (isMock) {
    const items = params?.search
      ? mockReports.filter((r) =>
          r.domain_name.toLowerCase().includes(params.search!.toLowerCase()),
        )
      : mockReports
    return { items, totalItems: items.length, totalPages: 1 }
  }

  const url = new URL(`${BASE_URL}/api/summaries`)
  if (params?.search)   url.searchParams.set("search",  params.search)
  if (params?.page)     url.searchParams.set("page",    String(params.page))
  if (params?.perPage)  url.searchParams.set("perPage", String(params.perPage))

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// ── Singolo report ─────────────────────────────────────────
export async function fetchReport(id: string): Promise<SecurityReport> {
  if (isMock) {
    const report = mockReports.find((r) => r.idsummary === id)
    if (!report) throw new Error(`Report "${id}" not found`)
    return report
  }

  const res = await fetch(`${BASE_URL}/api/summaries/${id}`)
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
    headers: { "Content-Type": "application/json" },
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
  const res = await fetch(`${BASE_URL}/api/summaries/${id}`, { method: "DELETE" })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.message ?? `HTTP ${res.status}`)
  }
}

// ── Seed (utility) ─────────────────────────────────────────
export async function seedDatabase(): Promise<void> {
  if (isMock) return
  const res = await fetch(`${BASE_URL}/api/summaries/seed`, { method: "POST" })
  if (!res.ok) throw new Error(`Seed failed: HTTP ${res.status}`)
}
