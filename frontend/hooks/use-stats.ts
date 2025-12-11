import { useQuery } from "@tanstack/react-query"
import { statsService } from "@/lib/api"

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => statsService.getDashboard(),
  })
}

export function useTrends() {
  return useQuery({
    queryKey: ["trends"],
    queryFn: () => statsService.getTrends(),
  })
}