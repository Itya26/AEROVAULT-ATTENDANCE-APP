import { boolean, date, doublePrecision, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { employeesTable } from "./employees";

export const attendanceStatusEnum = ["present", "late", "half_day", "absent", "on_leave"] as const;

export const attendanceTable = pgTable("attendance", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id")
    .notNull()
    .references(() => employeesTable.id),
  date: date("date", { mode: "string" }).notNull(),
  checkInTime: timestamp("check_in_time", { withTimezone: true }),
  checkInLatitude: doublePrecision("check_in_latitude"),
  checkInLongitude: doublePrecision("check_in_longitude"),
  checkInAccuracy: doublePrecision("check_in_accuracy"),
  checkOutTime: timestamp("check_out_time", { withTimezone: true }),
  checkOutLatitude: doublePrecision("check_out_latitude"),
  checkOutLongitude: doublePrecision("check_out_longitude"),
  checkOutAccuracy: doublePrecision("check_out_accuracy"),
  workingHours: doublePrecision("working_hours"),
  status: text("status", { enum: attendanceStatusEnum }).notNull().default("present"),
  locationVerified: boolean("location_verified").notNull().default(false),
  deviceInfo: text("device_info"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAttendanceSchema = createInsertSchema(attendanceTable).omit({
  id: true,
  createdAt: true,
});
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Attendance = typeof attendanceTable.$inferSelect;
