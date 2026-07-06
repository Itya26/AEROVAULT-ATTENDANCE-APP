import { Router, type IRouter } from "express";
import { and, eq, sql } from "drizzle-orm";
import { attendanceTable, db, employeesTable, leavesTable } from "@workspace/db";
import { GetEmployeeDashboardSummaryResponse, GetHrDashboardSummaryResponse } from "@workspace/api-zod";
import { requireAuth, requireRole } from "../middlewares/auth";

const router: IRouter = Router();

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

router.get("/dashboard/employee-summary", requireAuth, async (req, res): Promise<void> => {
  const employee = req.currentEmployee!;
  const [row] = await db
    .select()
    .from(attendanceTable)
    .where(and(eq(attendanceTable.employeeId, employee.id), eq(attendanceTable.date, todayDateString())));

  res.json(
    GetEmployeeDashboardSummaryResponse.parse({
      status: row?.status ?? "absent",
      checkInTime: row?.checkInTime ?? null,
      checkOutTime: row?.checkOutTime ?? null,
      workingHoursToday: row?.workingHours ?? null,
      officeVerified: row?.locationVerified ?? false,
    }),
  );
});

router.get(
  "/dashboard/hr-summary",
  requireAuth,
  requireRole("hr", "admin"),
  async (_req, res): Promise<void> => {
    const date = todayDateString();

    const [totalActiveResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(employeesTable)
      .where(eq(employeesTable.isActive, true));

    const [presentResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(attendanceTable)
      .where(and(eq(attendanceTable.date, date), eq(attendanceTable.status, "present")));

    const [lateResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(attendanceTable)
      .where(and(eq(attendanceTable.date, date), eq(attendanceTable.status, "late")));

    const [checkedInResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(attendanceTable)
      .where(and(eq(attendanceTable.date, date), sql`${attendanceTable.checkInTime} is not null`));

    const [pendingLeavesResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(leavesTable)
      .where(eq(leavesTable.status, "pending"));

    const totalActive = totalActiveResult.count;
    const checkedIn = checkedInResult.count;
    const presentToday = presentResult.count + lateResult.count;
    const yetToCheckIn = Math.max(totalActive - checkedIn, 0);
    const absentToday = Math.max(totalActive - checkedIn, 0);
    const attendancePercentage = totalActive > 0 ? Math.round((checkedIn / totalActive) * 1000) / 10 : 0;

    res.json(
      GetHrDashboardSummaryResponse.parse({
        presentToday,
        absentToday,
        lateArrivals: lateResult.count,
        pendingLeaveRequests: pendingLeavesResult.count,
        checkedIn,
        yetToCheckIn,
        attendancePercentage,
      }),
    );
  },
);

export default router;
