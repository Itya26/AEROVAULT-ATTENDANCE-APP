import { doublePrecision, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const officeLocationsTable = pgTable("office_locations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  radiusMeters: integer("radius_meters").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertOfficeLocationSchema = createInsertSchema(officeLocationsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertOfficeLocation = z.infer<typeof insertOfficeLocationSchema>;
export type OfficeLocation = typeof officeLocationsTable.$inferSelect;
