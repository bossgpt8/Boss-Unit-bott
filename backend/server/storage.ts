import {
  type BotSettings,
  type UpdateBotSettings,
  type Log,
  type UserSession,
  type InsertUserSession,
  type UpdateUserSession,
  type UserSettings,
  type UpdateUserSettings,
  type UserLog,
} from "../shared/schema";

export interface IStorage {
  getSettings(): Promise<BotSettings>;
  updateSettings(settings: UpdateBotSettings): Promise<BotSettings>;
  addLog(level: string, message: string): Promise<Log>;
  getLogs(limit?: number): Promise<Log[]>;
  clearLogs(): Promise<void>;
  createUserSession(session: InsertUserSession): Promise<UserSession>;
  getUserSession(userId: string): Promise<UserSession | null>;
  updateUserSession(userId: string, updates: UpdateUserSession): Promise<UserSession>;
  deleteUserSession(userId: string): Promise<void>;
  getUserSettings(userId: string): Promise<UserSettings>;
  updateUserSettings(userId: string, settings: UpdateUserSettings): Promise<UserSettings>;
  addUserLog(userId: string, level: string, message: string): Promise<UserLog>;
  getUserLogs(userId: string, limit?: number): Promise<UserLog[]>;
  clearUserLogs(userId: string): Promise<void>;
}

const inMemoryLogs = new Map<string, UserLog[]>();
const MAX_LOGS_PER_USER = 500;

const defaultSettings = { 
  id: 1, 
  botName: "Boss", 
  ownerNumber: "2349164898577", 
  publicMode: "public", 
  autoRead: false, 
  welcomeEnabled: false, 
  goodbyeEnabled: false, 
  autoStatusRead: false, 
  autoTyping: false 
};

let globalSettings = { ...defaultSettings };
const userSettingsStore = new Map<string, UserSettings>();
const userSessionsStore = new Map<string, UserSession>();

export class MemStorage implements IStorage {
  async getSettings(): Promise<BotSettings> {
    return globalSettings as any;
  }

  async updateSettings(updates: UpdateBotSettings): Promise<BotSettings> {
    globalSettings = { ...globalSettings, ...updates } as any;
    return globalSettings as any;
  }

  async addLog(level: string, message: string): Promise<Log> {
    const logData = { level, message, timestamp: new Date() };
    await this.addUserLog("default", level, message);
    return logData as any;
  }

  async getLogs(lim = 50): Promise<Log[]> {
    return [];
  }

  async clearLogs(): Promise<void> {
    inMemoryLogs.clear();
  }

  async createUserSession(session: InsertUserSession): Promise<UserSession> {
    userSessionsStore.set(session.userId, session as any);
    return session as any;
  }

  async getUserSession(userId: string): Promise<UserSession | null> {
    return userSessionsStore.get(userId) || null;
  }

  async updateUserSession(userId: string, updates: UpdateUserSession): Promise<UserSession> {
    const session = userSessionsStore.get(userId) || { userId } as any;
    const updated = { ...session, ...updates };
    userSessionsStore.set(userId, updated);
    return updated;
  }

  async deleteUserSession(userId: string): Promise<void> {
    userSessionsStore.delete(userId);
  }

  async getUserSettings(userId: string): Promise<UserSettings> {
    if (!userSettingsStore.has(userId)) {
      userSettingsStore.set(userId, { userId, botName: "Boss", publicMode: "public" } as any);
    }
    return userSettingsStore.get(userId)!;
  }

  async updateUserSettings(userId: string, updates: UpdateUserSettings): Promise<UserSettings> {
    const current = await this.getUserSettings(userId);
    const updated = { ...current, ...updates };
    userSettingsStore.set(userId, updated);
    return updated;
  }

  async addUserLog(userId: string, level: string, message: string): Promise<UserLog> {
    const id = Math.floor(Math.random() * 1000000);
    const log: UserLog = { id, userId, level, message, timestamp: new Date() };
    
    if (!inMemoryLogs.has(userId)) {
      inMemoryLogs.set(userId, []);
    }
    
    const logs = inMemoryLogs.get(userId)!;
    logs.push(log);
    
    if (logs.length > MAX_LOGS_PER_USER) {
      logs.shift();
    }
    
    return log;
  }

  async getUserLogs(userId: string, lim = 100): Promise<UserLog[]> {
    const logs = inMemoryLogs.get(userId) || [];
    return logs.slice(-lim).reverse();
  }

  async clearUserLogs(userId: string): Promise<void> {
    inMemoryLogs.set(userId, []);
  }
}

export const storage = new MemStorage();
