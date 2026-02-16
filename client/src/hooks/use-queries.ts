import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { API_BASE_URL } from "@/lib/utils";

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
      const res = await fetch(`${API_BASE_URL}${api.queries.list.path}`);
      if (!res.ok) throw new Error("Failed to fetch query history");
      return await res.json() as QueryHistory[];
    },
  });
}

export function useCreateQuery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (text: string) => {
      try {
        const res = await fetch(`${API_BASE_URL}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: text }),
        });

        if (!res.ok) {
          // Fallback to test endpoint if chat fails
          console.warn("Chat endpoint failed, trying test endpoint...");
          const testRes = await fetch(`${API_BASE_URL}/test`);
          const testData = await testRes.json();
          return {
            id: Date.now(),
            queryText: text,
            responseText: `Fallback: ${testData.message}`,
            timestamp: new Date().toISOString(),
            accuracy: 0,
            relatedCircularId: null
          } as QueryHistory;
        }

        const data = await res.json();
        return {
          id: Date.now(),
          queryText: text,
          responseText: data.reply,
          timestamp: new Date().toISOString(),
          accuracy: 0.95,
          relatedCircularId: null
        } as QueryHistory;

      } catch (error) {
        console.error("Backend connection error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.queries.list.path] });
    },
  });
}
