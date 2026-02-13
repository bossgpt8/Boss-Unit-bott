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

export class FirestoreStorage implements IStorage {
  async getSettings(): Promise<BotSettings> {
    const docRef = doc(db, "bot_settings", "global");
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      const defaultSettings = { id: 1, botName: "Boss", ownerNumber: "2349164898577", publicMode: true, autoRead: false, welcomeEnabled: false, goodbyeEnabled: false, autoStatusRead: false, autoTyping: false };
      await setDoc(docRef, defaultSettings);
      return defaultSettings as any;
    }
    return docSnap.data() as any;
  }

  async updateSettings(updates: UpdateBotSettings): Promise<BotSettings> {
    const docRef = doc(db, "bot_settings", "global");
    await updateDoc(docRef, { ...updates, updatedAt: serverTimestamp() });
    return this.getSettings();
  }

  async addLog(level: string, message: string): Promise<Log> {
    const logData = { level, message, timestamp: new Date().toISOString() };
    await addDoc(collection(db, "logs"), logData);
    return logData as any;
  }

  async getLogs(lim = 50): Promise<Log[]> {
    const q = query(collection(db, "logs"), orderBy("timestamp", "desc"), limit(lim));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id })) as any;
  }

  async clearLogs(): Promise<void> {
    const snap = await getDocs(collection(db, "logs"));
    for (const d of snap.docs) await deleteDoc(d.ref);
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
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      const defaultSet = { userId, botName: "Boss", publicMode: true };
      await setDoc(docRef, defaultSet);
      return defaultSet as any;
    }
    return docSnap.data() as any;
  }

  async updateUserSettings(userId: string, updates: UpdateUserSettings): Promise<UserSettings> {
    await updateDoc(doc(db, "user_settings", userId), { ...updates, updatedAt: serverTimestamp() });
    return this.getUserSettings(userId);
  }

  async addUserLog(userId: string, level: string, message: string): Promise<UserLog> {
    const log = { userId, level, message, timestamp: new Date().toISOString() };
    await addDoc(collection(db, `user_logs_${userId}`), log);
    return log as any;
  }

  async getUserLogs(userId: string, lim = 50): Promise<UserLog[]> {
    const q = query(collection(db, `user_logs_${userId}`), orderBy("timestamp", "desc"), limit(lim));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data()) as any;
  }

  async clearUserLogs(userId: string): Promise<void> {
    const snap = await getDocs(collection(db, `user_logs_${userId}`));
    for (const d of snap.docs) await deleteDoc(d.ref);
  }
}

export const storage = new FirestoreStorage();
