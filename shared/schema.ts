import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Circulars/Documents
export const circulars = pgTable("circulars", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  date: timestamp("date").defaultNow(),
  category: text("category").notNull(), // e.g., "Compliance", "Lending", "Forex"
  status: text("status").default("Active"), // Active, Superseded
  fileUrl: text("file_url"),
  fileSize: text("file_size"),
  summary: text("summary"),
});

// Chat/Query History
export const queries = pgTable("queries", {
  id: serial("id").primaryKey(),
  queryText: text("query_text").notNull(),
  responseText: text("response_text").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  accuracy: integer("accuracy"), // Percentage
  relatedCircularId: integer("related_circular_id"),
});

// Analytics Data (Mock data storage)
export const analytics = pgTable("analytics", {
  id: serial("id").primaryKey(),
  metric: text("metric").notNull(),
  value: integer("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schemas
export const insertCircularSchema = createInsertSchema(circulars).omit({ id: true, date: true });
export const insertQuerySchema = createInsertSchema(queries).omit({ id: true, timestamp: true });
export const insertAnalyticsSchema = createInsertSchema(analytics).omit({ id: true, updatedAt: true });

// Types
export type Circular = typeof circulars.$inferSelect;
export type InsertCircular = z.infer<typeof insertCircularSchema>;
export type Query = typeof queries.$inferSelect;
export type InsertQuery = z.infer<typeof insertQuerySchema>;
export type Analytic = typeof analytics.$inferSelect;
