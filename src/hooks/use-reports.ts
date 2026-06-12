import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchReport, fetchReports, deleteReport } from "@/lib/api"

export function useReports(search?: string) {
  return useQuery({
    queryKey: ["reports", search ?? ""],
    queryFn: () => fetchReports(search ? { search } : undefined),
    staleTime: 30_000,
  })
}

export function useReport(id: string) {
  return useQuery({
    queryKey: ["report", id],
    queryFn: () => fetchReport(id),
    enabled: !!id,
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
