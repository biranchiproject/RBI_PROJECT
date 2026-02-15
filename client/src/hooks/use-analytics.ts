import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export interface AnalyticMetric {
  id: number;
  metric: string;
  value: number;
  updatedAt: string;
}

export function useAnalytics() {
  return useQuery({
    queryKey: [api.analytics.get.path],
    queryFn: async () => {
      const res = await fetch(api.analytics.get.path);
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return await res.json() as AnalyticMetric[];
    },
  });
}
