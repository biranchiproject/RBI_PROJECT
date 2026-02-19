
import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ... existing schemas ...

export const circulars = pgTable("circulars", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  date: timestamp("date").defaultNow(),
  category: text("category").notNull(),
  status: text("status").default("Active"),
  fileUrl: text("file_url"),
  fileSize: text("file_size"),
  summary: text("summary"),
});

export const queries = pgTable("queries", {
  id: serial("id").primaryKey(),
  queryText: text("query_text").notNull(),
  responseText: text("response_text").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  accuracy: integer("accuracy"),
  relatedCircularId: integer("related_circular_id"),
});

export const analytics = pgTable("analytics", {
  id: serial("id").primaryKey(),
  metric: text("metric").notNull(),
  value: integer("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// NEW: Notifications Table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  message: text("message").notNull(),
  type: text("type").notNull(), // "upload", "system", "error"
  is_read: boolean("is_read").default(false),
  created_at: timestamp("created_at").defaultNow(),
});

// Schemas
export const insertCircularSchema = createInsertSchema(circulars).omit({ id: true, date: true });
export const insertQuerySchema = createInsertSchema(queries).omit({ id: true, timestamp: true });
export const insertAnalyticsSchema = createInsertSchema(analytics).omit({ id: true, updatedAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, created_at: true });

// Types
export type Circular = typeof circulars.$inferSelect;
export type InsertCircular = z.infer<typeof insertCircularSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Query = typeof queries.$inferSelect;
export type InsertQuery = z.infer<typeof insertQuerySchema>;
export type Analytic = typeof analytics.$inferSelect;
export type InsertAnalytic = z.infer<typeof insertAnalyticsSchema>;
