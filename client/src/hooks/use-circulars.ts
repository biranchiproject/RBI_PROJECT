import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type InsertCircular } from "@shared/schema"; // Assuming schema exports types, usually routes.ts re-exports or we import directly if routes.ts doesn't. 
// Note: In strict mode we should check shared/routes.ts. The provided prompt implies types are in schema.ts but api definition is in routes.ts.
// I will adhere to the prompt's provided routes_manifest structure where needed.
import { api as apiRoutes } from "@shared/routes"; // Renaming to avoid confusion if needed, or just use api

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
      
      const url = `${apiRoutes.circulars.list.path}?${params.toString()}`;
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
      const res = await fetch(apiRoutes.circulars.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create circular");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [apiRoutes.circulars.list.path] });
    },
  });
}

export function useUploadCircular() {
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch(apiRoutes.circulars.upload.path, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      return await res.json() as { url: string; filename: string; size: string };
    },
  });
}
