import { db } from "./firebase";
import { collection, doc, getDoc, setDoc, updateDoc, query, limit, getDocs, orderBy, deleteDoc, addDoc, serverTimestamp } from "firebase/firestore";
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
const MAX_LOGS_PER_USER = 100;

export class FirestoreStorage implements IStorage {
  async getSettings(): Promise<BotSettings> {
    const docRef = doc(db, "bot_settings", "global");
    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as any;
      }
      const defaultSettings = { id: 1, botName: "Boss", ownerNumber: "2349164898577", publicMode: true, autoRead: false, welcomeEnabled: false, goodbyeEnabled: false, autoStatusRead: false, autoTyping: false };
      await setDoc(docRef, defaultSettings);
      return defaultSettings as any;
    } catch (error) {
      console.warn("Firestore offline or error, using defaults:", error);
      return { id: 1, botName: "Boss", ownerNumber: "2349164898577", publicMode: true, autoRead: false, welcomeEnabled: false, goodbyeEnabled: false, autoStatusRead: false, autoTyping: false } as any;
    }
  }

  async updateSettings(updates: UpdateBotSettings): Promise<BotSettings> {
    const docRef = doc(db, "bot_settings", "global");
    try {
      await updateDoc(docRef, { ...updates, updatedAt: serverTimestamp() });
    } catch (e) {
      console.warn("Failed to update settings in Firestore:", e);
    }
    return this.getSettings();
  }

  async addLog(level: string, message: string): Promise<Log> {
    const logData = { level, message, timestamp: new Date() };
    console.log(`[BOT LOG] [${level.toUpperCase()}] ${message}`);
    // Also add to default user logs so it shows in dashboard
    await this.addUserLog("default", level, message);
    return logData as any;
  }

  async getLogs(lim = 50): Promise<Log[]> {
    // Return empty as we don't persist logs to Firestore anymore
    return [];
  }

  async clearLogs(): Promise<void> {
    // No-op
  }

  async createUserSession(session: InsertUserSession): Promise<UserSession> {
    await setDoc(doc(db, "user_sessions", session.userId), { ...session, createdAt: serverTimestamp() });
    return session as any;
  }

  async getUserSession(userId: string): Promise<UserSession | null> {
    const docSnap = await getDoc(doc(db, "user_sessions", userId));
    return docSnap.exists() ? docSnap.data() as any : null;
  }

  async updateUserSession(userId: string, updates: UpdateUserSession): Promise<UserSession> {
    await updateDoc(doc(db, "user_sessions", userId), { ...updates, updatedAt: serverTimestamp() });
    return this.getUserSession(userId) as any;
  }

  async deleteUserSession(userId: string): Promise<void> {
    await deleteDoc(doc(db, "user_sessions", userId));
  }

  async getUserSettings(userId: string): Promise<UserSettings> {
    const docRef = doc(db, "user_settings", userId);
    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as any;
      }
      const defaultSet = { userId, botName: "Boss", publicMode: true };
      await setDoc(docRef, defaultSet);
      return defaultSet as any;
    } catch (error) {
      console.warn(`Firestore offline for user ${userId}, using defaults:`, error);
      return { userId, botName: "Boss", publicMode: true } as any;
    }
  }

  async updateUserSettings(userId: string, updates: UpdateUserSettings): Promise<UserSettings> {
    const docRef = doc(db, "user_settings", userId);
    try {
      await updateDoc(docRef, { ...updates, updatedAt: serverTimestamp() });
    } catch (e) {
      console.warn(`Failed to update user settings for ${userId}:`, e);
    }
    return this.getUserSettings(userId);
  }

  async addUserLog(userId: string, level: string, message: string): Promise<UserLog> {
    const id = Math.floor(Math.random() * 1000000);
    const log: UserLog = { id, userId, level, message, timestamp: new Date() };
    
    if (!inMemoryLogs.has(userId)) {
      inMemoryLogs.set(userId, []);
    }
    
    const logs = inMemoryLogs.get(userId)!;
    logs.push(log);
    
    // Keep only the last MAX_LOGS_PER_USER logs
    if (logs.length > MAX_LOGS_PER_USER) {
      logs.shift();
    }
    
    console.log(`[USER LOG] [${userId}] [${level.toUpperCase()}] ${message}`);
    return log;
  }

  async getUserLogs(userId: string, lim = 50): Promise<UserLog[]> {
    const logs = inMemoryLogs.get(userId) || [];
    return logs.slice(-lim).reverse();
  }

  async clearUserLogs(userId: string): Promise<void> {
    inMemoryLogs.set(userId, []);
  }
}

export const storage = new FirestoreStorage();
