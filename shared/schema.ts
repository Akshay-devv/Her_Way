import { pgTable, text, serial, integer, boolean, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  emergencyContact1: text("emergency_contact_1").notNull(),
  emergencyContact2: text("emergency_contact_2").notNull(),
  preferSafestRoute: boolean("prefer_safest_route").default(true),
  allowRealTimeUpdates: boolean("allow_real_time_updates").default(true),
});

export const safetyZones = pgTable("safety_zones", {
  id: serial("id").primaryKey(),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  radius: doublePrecision("radius").notNull(), // in meters
  riskLevel: text("risk_level").notNull(), // 'low', 'moderate', 'high'
  description: text("description"),
  reporterId: integer("reporter_id"), // null if system-generated
  createdAt: text("created_at"), // ISO string
});

export const safeStops = pgTable("safe_stops", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'police', 'hospital'
  name: text("name").notNull(),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  address: text("address").notNull(),
  phone: text("phone"),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertSafetyZoneSchema = createInsertSchema(safetyZones).omit({ id: true });
export const insertSafeStopSchema = createInsertSchema(safeStops).omit({ id: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type SafetyZone = typeof safetyZones.$inferSelect;
export type SafeStop = typeof safeStops.$inferSelect;
