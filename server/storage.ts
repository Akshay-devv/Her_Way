import { db, pool } from "./db";
import {
  users, safetyZones, safeStops,
  type User, type InsertUser, type SafetyZone, type SafeStop
} from "@shared/schema";
import { eq } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User>;
  
  getSafetyZones(): Promise<SafetyZone[]>;
  getSafeStops(): Promise<SafeStop[]>;
  
  // Seed helpers
  createSafetyZone(zone: Omit<SafetyZone, "id">): Promise<SafetyZone>;
  createSafeStop(stop: Omit<SafeStop, "id">): Promise<SafeStop>;
  
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    if (!user) throw new Error("User not found");
    return user;
  }

  async getSafetyZones(): Promise<SafetyZone[]> {
    return await db.select().from(safetyZones);
  }

  async getSafeStops(): Promise<SafeStop[]> {
    return await db.select().from(safeStops);
  }

  async createSafetyZone(zone: Omit<SafetyZone, "id">): Promise<SafetyZone> {
    const [newZone] = await db.insert(safetyZones).values(zone).returning();
    return newZone;
  }

  async createSafeStop(stop: Omit<SafeStop, "id">): Promise<SafeStop> {
    const [newStop] = await db.insert(safeStops).values(stop).returning();
    return newStop;
  }
}

export const storage = new DatabaseStorage();
