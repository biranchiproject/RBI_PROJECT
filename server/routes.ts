import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Circulars
  app.get(api.circulars.list.path, async (req, res) => {
    const circulars = await storage.getCirculars();
    res.json(circulars);
  });

  app.post(api.circulars.create.path, async (req, res) => {
    const input = api.circulars.create.input.parse(req.body);
    const circular = await storage.createCircular(input);
    res.status(201).json(circular);
  });
  
  // Mock Upload
  app.post(api.circulars.upload.path, async (req, res) => {
    // In a real app, handle multer upload here
    res.json({ 
        url: "/uploads/mock-file.pdf", 
        filename: "uploaded-circular.pdf",
        size: "1.2 MB" 
    });
  });

  // Analytics
  app.get(api.analytics.get.path, async (req, res) => {
    const data = await storage.getAnalytics();
    res.json(data);
  });

  // AI Chat / Queries
  app.get(api.queries.list.path, async (req, res) => {
    const queries = await storage.getQueries();
    res.json(queries);
  });

  app.post(api.queries.create.path, async (req, res) => {
    const { query } = req.body;
    
    // Mock AI Logic
    let responseText = "I'm processing your query regarding RBI circulars.";
    let relatedCircularId = null;

    if (query.toLowerCase().includes("kyc")) {
        responseText = "According to the Master Direction on KYC (2016), Regulated Entities must undertake a risk-based approach to KYC. Periodic updation is required at least once every 2 years for high risk customers.";
        relatedCircularId = 1; // Assuming mock ID 1 is KYC
    } else if (query.toLowerCase().includes("npa") || query.toLowerCase().includes("asset")) {
        responseText = "As per Prudential Norms, an asset becomes non-performing when it ceases to generate income for the bank. A term loan is treated as NPA if interest/installment remains overdue for more than 90 days.";
        relatedCircularId = 2;
    } else {
        responseText = "I can help you with RBI circulars related to KYC, Lending, Forex, and Compliance. Could you please specify which regulation you are interested in?";
    }

    const newQuery = await storage.createQuery({
        queryText: query,
        responseText: responseText,
        accuracy: 98,
        relatedCircularId: relatedCircularId
    });

    res.status(201).json(newQuery);
  });

  // Seed data on startup
  await storage.seedAnalytics();

  return httpServer;
}
