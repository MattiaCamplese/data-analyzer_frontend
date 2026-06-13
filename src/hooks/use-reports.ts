import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchReport, fetchReports, fetchReportHistory, deleteReport } from "@/lib/api"
import type { SecurityReport } from "@/types/report"

export function useReports(search?: string) {
  return useQuery({
    queryKey: ["reports", search ?? ""],
    queryFn: () => fetchReports(search ? { search } : undefined),
    staleTime: 30_000,
  })
}

export function useReportsByDate(date: string) {
  return useQuery({
    queryKey: ["reports-by-date", date],
    queryFn: () => fetchReports({ date, latest: false }),
    enabled: !!date,
    staleTime: 0,
    gcTime: 0,
  })
}

export function useAllReports() {
  return useQuery({
    queryKey: ["reports-all"],
    queryFn: () => fetchReports({ latest: false }),
    staleTime: 30_000,
  })
}

export function useReport(domain: string, scanId?: string) {
  const queryClient = useQueryClient()
  return useQuery({
    queryKey: ["report", domain, scanId ?? "latest"],
    queryFn: async () => {
      // Specific historical scan: fetch directly by UUID
      if (scanId) return fetchReport(scanId)
      // Latest scan: resolve UUID from cache or fallback to domain name
      const list = queryClient.getQueryData<{ items: SecurityReport[] }>(["reports", ""])
      const match = list?.items.find((r) => r.domain_name === domain)
      return fetchReport(match?.idsummary ?? domain)
    },
    enabled: !!domain,
    staleTime: 30_000,
  })
}

export function useReportHistory(domain: string) {
  return useQuery({
    queryKey: ["report-history", domain],
    queryFn: () => fetchReportHistory(domain),
    enabled: !!domain,
    staleTime: 30_000,
  })
}

export function useDeleteReport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] })
    },
  })
}
