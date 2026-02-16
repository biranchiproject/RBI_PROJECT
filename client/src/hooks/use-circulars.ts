import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type InsertCircular } from "@shared/schema";
import { api as apiRoutes } from "@shared/routes";
import { API_BASE_URL } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

// Types based on the schema provided in prompt
export interface Circular {
  id: number;
  title: string;
  date: string; // ISO string from JSON
  category: string;
  status: string;
  fileUrl: string | null;
  fileSize: string | null;
  summary: string | null;
}

export function useCirculars(search?: string, category?: string) {
  return useQuery({
    queryKey: [apiRoutes.circulars.list.path, search, category],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (category) params.append("category", category);

      const url = `${API_BASE_URL}${apiRoutes.circulars.list.path}?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch circulars");
      return await res.json() as Circular[];
    },
  });
}

export function useCreateCircular() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertCircular) => {
      const res = await apiRequest("POST", apiRoutes.circulars.create.path, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [apiRoutes.circulars.list.path] });
    },
  });
}

export function useUploadCircular() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      // Changed from /api/circulars/upload to /api/upload as per backend route
      const res = await apiRequest("POST", "/api/upload", formData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [apiRoutes.circulars.list.path] });
    },
  });
}
