import { date, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { employeesTable } from "./employees";

export const leaveTypeEnum = ["casual", "sick", "permission", "wfh"] as const;
export const leaveStatusEnum = ["pending", "approved", "rejected"] as const;

export const leavesTable = pgTable("leaves", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id")
    .notNull()
    .references(() => employeesTable.id),
  type: text("type", { enum: leaveTypeEnum }).notNull(),
  startDate: date("start_date", { mode: "string" }).notNull(),
  endDate: date("end_date", { mode: "string" }).notNull(),
  reason: text("reason").notNull(),
  attachmentUrl: text("attachment_url"),
  status: text("status", { enum: leaveStatusEnum }).notNull().default("pending"),
  reviewNotes: text("review_notes"),
  reviewedBy: integer("reviewed_by").references(() => employeesTable.id),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertLeaveSchema = createInsertSchema(leavesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertLeave = z.infer<typeof insertLeaveSchema>;
export type Leave = typeof leavesTable.$inferSelect;
