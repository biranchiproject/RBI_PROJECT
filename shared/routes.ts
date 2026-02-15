import { z } from 'zod';
import { insertCircularSchema, insertQuerySchema, circulars, queries, analytics } from './schema';

export const api = {
  circulars: {
    list: {
      method: 'GET' as const,
      path: '/api/circulars' as const,
      input: z.object({
        search: z.string().optional(),
        category: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof circulars.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/circulars' as const,
      input: insertCircularSchema,
      responses: {
        201: z.custom<typeof circulars.$inferSelect>(),
      },
    },
    upload: {
      method: 'POST' as const,
      path: '/api/circulars/upload' as const,
      input: z.any(), // FormData
      responses: {
        200: z.object({ url: z.string(), filename: z.string(), size: z.string() }),
      },
    }
  },
  queries: {
    list: {
      method: 'GET' as const,
      path: '/api/queries' as const,
      responses: {
        200: z.array(z.custom<typeof queries.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/queries' as const,
      input: z.object({ query: z.string() }), // Simple input for chat
      responses: {
        201: z.custom<typeof queries.$inferSelect>(), // Returns the AI response
      },
    },
  },
  analytics: {
    get: {
      method: 'GET' as const,
      path: '/api/analytics' as const,
      responses: {
        200: z.array(z.custom<typeof analytics.$inferSelect>()),
      },
    }
  }
};
