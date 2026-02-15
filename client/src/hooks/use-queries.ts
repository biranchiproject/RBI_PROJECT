import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";

export interface QueryHistory {
  id: number;
  queryText: string;
  responseText: string;
  timestamp: string;
  accuracy: number | null;
  relatedCircularId: number | null;
}

export function useQueries() {
  return useQuery({
    queryKey: [api.queries.list.path],
    queryFn: async () => {
      const res = await fetch(api.queries.list.path);
      if (!res.ok) throw new Error("Failed to fetch query history");
      return await res.json() as QueryHistory[];
    },
  });
}

export function useCreateQuery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (text: string) => {
      const res = await fetch(api.queries.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text }),
      });
      if (!res.ok) throw new Error("Failed to process query");
      return await res.json() as QueryHistory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.queries.list.path] });
    },
  });
}
