import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { botManager } from "./botManager";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerImageRoutes } from "./replit_integrations/image";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Bot Status
  app.get(api.bot.status.path, (req, res) => {
    res.json(botManager.getStatus());
  });

  // Bot Actions
  app.post(api.bot.action.path, async (req, res) => {
    const { action, phoneNumber, userId } = req.body;
    try {
      switch (action) {
        case "start":
          await botManager.start(phoneNumber, true, userId);
          res.json({ success: true, message: "Bot starting..." });
          break;
        case "stop":
          await botManager.stop();
          res.json({ success: true, message: "Bot stopped." });
          break;
        case "restart":
          await botManager.stop();
          await botManager.start(phoneNumber, true, userId);
          res.json({ success: true, message: "Bot restarting..." });
          break;
        case "logout":
          await botManager.logout();
          res.json({ success: true, message: "Bot logged out." });
          break;
        default:
          res.status(400).json({ message: "Invalid action" });
      }
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Logs
  app.get(api.bot.logs.path, async (req, res) => {
    const userId = req.query.userId as string;
    const logs = userId ? await storage.getUserLogs(userId) : await storage.getLogs();
    res.json(logs);
  });

  // Clear Logs
  app.delete("/api/bot/logs", async (req, res) => {
    const userId = req.query.userId as string;
    try {
      if (userId) {
        await storage.clearUserLogs(userId);
      } else {
        await storage.clearLogs();
      }
      res.json({ success: true, message: "Logs cleared." });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Settings
  app.get(api.settings.get.path, async (req, res) => {
    const userId = req.query.userId as string;
    const settings = userId ? await storage.getUserSettings(userId) : await storage.getSettings();
    res.json(settings);
  });

  app.patch(api.settings.update.path, async (req, res) => {
    const userId = req.query.userId as string;
    const input = api.settings.update.input.parse(req.body);
    const settings = userId ? await storage.updateUserSettings(userId, input) : await storage.updateSettings(input);
    res.json(settings);
  });

  // Seed default settings on startup
  await storage.getSettings();

  return httpServer;
}
