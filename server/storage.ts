import { db } from "./db";
import {
  botSettings,
  logs,
  userSessions,
  userSettings,
  userLogs,
  type BotSettings,
  type InsertBotSettings,
  type UpdateBotSettings,
  type Log,
  type UserSession,
  type InsertUserSession,
  type UpdateUserSession,
  type UserSettings,
  type InsertUserSettings,
  type UpdateUserSettings,
  type UserLog,
} from "../shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Global Settings
  getSettings(): Promise<BotSettings>;
  updateSettings(settings: UpdateBotSettings): Promise<BotSettings>;

  // Global Logs
  addLog(level: string, message: string): Promise<Log>;
  getLogs(limit?: number): Promise<Log[]>;
  clearLogs(): Promise<void>;

  // User Sessions
  createUserSession(session: InsertUserSession): Promise<UserSession>;
  getUserSession(userId: string): Promise<UserSession | null>;
  updateUserSession(userId: string, updates: UpdateUserSession): Promise<UserSession>;
  deleteUserSession(userId: string): Promise<void>;

  // User Settings
  getUserSettings(userId: string): Promise<UserSettings>;
  updateUserSettings(userId: string, settings: UpdateUserSettings): Promise<UserSettings>;

  // User Logs
  addUserLog(userId: string, level: string, message: string): Promise<UserLog>;
  getUserLogs(userId: string, limit?: number): Promise<UserLog[]>;
  clearUserLogs(userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getSettings(userId?: string): Promise<BotSettings> {
    const query = userId ? db.select().from(botSettings).where(eq(botSettings.ownerNumber, userId)) : db.select().from(botSettings).limit(1);
    const [settings] = await query;
    if (!settings) {
      // Create default settings if not exists
      const [newSettings] = await db
        .insert(botSettings)
        .values({
          botName: "Boss",
          ownerNumber: userId || "2349164898577",
        })
        .returning();
      return newSettings;
    }
    return settings;
  }

  async updateSettings(updates: UpdateBotSettings): Promise<BotSettings> {
    const current = await this.getSettings();
    const [updated] = await db
      .update(botSettings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(botSettings.id, current.id))
      .returning();
    return updated;
  }

  async addLog(level: string, message: string): Promise<Log> {
    const [log] = await db
      .insert(logs)
      .values({
        level,
        message,
      })
      .returning();
    return log;
  }

  async getLogs(limit: number = 50): Promise<Log[]> {
    return await db
      .select()
      .from(logs)
      .orderBy(desc(logs.timestamp))
      .limit(limit);
  }

  async clearLogs(): Promise<void> {
    await db.delete(logs);
  }

  // User Sessions
  async createUserSession(session: InsertUserSession): Promise<UserSession> {
    const [newSession] = await db
      .insert(userSessions)
      .values(session)
      .returning();
    return newSession;
  }

  async getUserSession(userId: string): Promise<UserSession | null> {
    const [session] = await db
      .select()
      .from(userSessions)
      .where(eq(userSessions.userId, userId))
      .limit(1);
    return session || null;
  }

  async updateUserSession(userId: string, updates: UpdateUserSession): Promise<UserSession> {
    const [updated] = await db
      .update(userSessions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userSessions.userId, userId))
      .returning();
    return updated;
  }

  async deleteUserSession(userId: string): Promise<void> {
    await db.delete(userSessions).where(eq(userSessions.userId, userId));
  }

  // User Settings
  async getUserSettings(userId: string): Promise<UserSettings> {
    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);

    if (!settings) {
      // Create default user settings
      const [newSettings] = await db
        .insert(userSettings)
        .values({
          userId,
          botName: "Boss",
        })
        .returning();
      return newSettings;
    }
    return settings;
  }

  async updateUserSettings(userId: string, updates: UpdateUserSettings): Promise<UserSettings> {
    const current = await this.getUserSettings(userId);
    const [updated] = await db
      .update(userSettings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userSettings.id, current.id))
      .returning();
    return updated;
  }

  // User Logs
  async addUserLog(userId: string, level: string, message: string): Promise<UserLog> {
    const [log] = await db
      .insert(userLogs)
      .values({
        userId,
        level,
        message,
      })
      .returning();
    return log;
  }

  async getUserLogs(userId: string, limit: number = 50): Promise<UserLog[]> {
    return await db
      .select()
      .from(userLogs)
      .where(eq(userLogs.userId, userId))
      .orderBy(desc(userLogs.timestamp))
      .limit(limit);
  }

  async clearUserLogs(userId: string): Promise<void> {
    await db.delete(userLogs).where(eq(userLogs.userId, userId));
  }
}

export const storage = new DatabaseStorage();
