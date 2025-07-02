import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMessageSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const CURRENT_USER_ID = 1; // 👈 Hardcoded user (Sarah)

  // Get current user
  app.get("/api/user/current", async (_req, res) => {
    const user = await storage.getUser(CURRENT_USER_ID);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  });

  // Get contacts
  app.get("/api/contacts", async (_req, res) => {
    const contacts = await storage.getContacts(CURRENT_USER_ID);
    res.json(contacts);
  });

  // Get messages with a contact
  app.get("/api/messages/:contactId", async (req, res) => {
    const contactId = parseInt(req.params.contactId);
    if (isNaN(contactId)) return res.status(400).json({ message: "Invalid contact ID" });

    const messages = await storage.getMessages(CURRENT_USER_ID, contactId);
    res.json(messages);
  });

  // Send a new message
  app.post("/api/messages", async (req, res) => {
    try {
      const messageData = insertMessageSchema.parse({
        ...req.body,
        senderId: CURRENT_USER_ID,
      });

      const message = await storage.sendMessage(messageData);
      const sender = await storage.getUser(CURRENT_USER_ID);

      res.status(201).json({ ...message, sender });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid message", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Mark message as read
  app.patch("/api/messages/:messageId/read", async (req, res) => {
    const messageId = parseInt(req.params.messageId);
    if (isNaN(messageId)) return res.status(400).json({ message: "Invalid message ID" });

    await storage.markMessageAsRead(messageId);
    res.json({ success: true });
  });

  // Update user status
  app.patch("/api/user/status", async (req, res) => {
    const { status } = req.body;
    if (!status || typeof status !== "string") {
      return res.status(400).json({ message: "Invalid status" });
    }

    await storage.updateUserStatus(CURRENT_USER_ID, status);
    res.json({ success: true });
  });

  const httpServer = createServer(app);
  return httpServer;
}


