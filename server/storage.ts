import { db } from "./db";
import {
  circulars, queries, analytics,
  type InsertCircular, type InsertQuery, type Circular, type Query, type Analytic
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Circulars
  getCirculars(): Promise<Circular[]>;
  createCircular(circular: InsertCircular): Promise<Circular>;

  // Queries/Chat
  getQueries(): Promise<Query[]>;
  createQuery(query: InsertQuery): Promise<Query>;

  // Analytics
  getAnalytics(): Promise<Analytic[]>;
  seedAnalytics(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getCirculars(): Promise<Circular[]> {
    return await db.select().from(circulars).orderBy(desc(circulars.date));
  }

  async createCircular(circular: InsertCircular): Promise<Circular> {
    const [newCircular] = await db.insert(circulars).values(circular).returning();
    return newCircular;
  }

  async getQueries(): Promise<Query[]> {
    return await db.select().from(queries).orderBy(desc(queries.timestamp));
  }

  async createQuery(query: InsertQuery): Promise<Query> {
    const [newQuery] = await db.insert(queries).values(query).returning();
    return newQuery;
  }

  async getAnalytics(): Promise<Analytic[]> {
    return await db.select().from(analytics);
  }

  async seedAnalytics(): Promise<void> {
    const count = await db.select().from(analytics);
    if (count.length === 0) {
      await db.insert(analytics).values([
        { metric: "Total Circulars", value: 1240 },
        { metric: "Queries Processed", value: 8560 },
        { metric: "Compliance Accuracy", value: 99 },
        { metric: "Active Users", value: 45 },
      ]);
    }

    // Seed some circulars if empty
    const circs = await db.select().from(circulars);
    if (circs.length === 0) {
      await db.insert(circulars).values([
        { title: "Master Direction - Reserve Bank of India (KYC) Directions, 2016", category: "KYC", status: "Active", summary: "Consolidated KYC guidelines for regulated entities.", fileSize: "2.4 MB" },
        { title: "Prudential Norms on Income Recognition, Asset Classification", category: "Lending", status: "Active", summary: "Guidelines on NPA classification and provisioning.", fileSize: "1.8 MB" },
        { title: "Foreign Exchange Management (Export of Goods and Services) Regulations", category: "Forex", status: "Superseded", summary: "Updated regulations for export transactions.", fileSize: "3.1 MB" },
        { title: "Framework for Compromise Settlements and Technical Write-offs", category: "Recovery", status: "Active", summary: "Instructions for regulated entities on compromise settlements.", fileSize: "1.2 MB" },
      ]);
    }
  }
}

export const storage = new DatabaseStorage();
