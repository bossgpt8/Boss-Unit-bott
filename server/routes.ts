import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { botManager } from "./botManager";

import cors from "cors";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.use(cors());

  // Bot Status
  app.get(api.bot.status.path, (req, res) => {
    res.json(botManager.getStatus());
  });

  // Bot Actions
  app.post(api.bot.action.path, async (req, res) => {
    const { action, phoneNumber, userId, forceNewSession } = req.body;
    try {
      switch (action) {
        case "start":
          // Start the bot process - logs will be handled internally with delays
          botManager.start(phoneNumber, forceNewSession !== undefined ? forceNewSession : true, userId);
          res.json({ 
            success: true, 
            message: "System sequence started..." 
          });
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

  // Logs SSE Stream
  app.get("/api/bot/logs/stream", (req, res) => {
    const userId = (req.query.userId as string) || "default";
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const unsubscribe = botManager.subscribeLogs(userId, (log) => {
      res.write(`data: ${JSON.stringify(log)}\n\n`);
    });

    req.on("close", () => {
      unsubscribe();
    });
  });

  // Logs (Legacy endpoint - returns empty as we don't persist)
  app.get(api.bot.logs.path, async (req, res) => {
    res.json([]);
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
