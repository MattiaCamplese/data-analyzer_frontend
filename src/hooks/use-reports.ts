import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchReport, fetchReports, deleteReport } from "@/lib/api"
import type { SecurityReport } from "@/types/report"

export function useReports(search?: string) {
  return useQuery({
    queryKey: ["reports", search ?? ""],
    queryFn: () => fetchReports(search ? { search } : undefined),
    staleTime: 30_000,
  })
}

export function useReport(domain: string) {
  const queryClient = useQueryClient()
  return useQuery({
    queryKey: ["report", domain],
    queryFn: async () => {
      const list = queryClient.getQueryData<{ items: SecurityReport[] }>(["reports", ""])
      const match = list?.items.find((r) => r.domain_name === domain)
      return fetchReport(match?.idsummary ?? domain)
    },
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
