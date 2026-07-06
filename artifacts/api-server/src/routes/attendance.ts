import { Router, type IRouter } from "express";
import { and, desc, eq, gte, lt, sql } from "drizzle-orm";
import {
  attendanceTable,
  db,
  departmentsTable,
  employeesTable,
  officeLocationsTable,
} from "@workspace/db";
import {
  CheckInBody,
  CheckInResponse,
  CheckOutBody,
  CheckOutResponse,
  CorrectAttendanceBody,
  CorrectAttendanceParams,
  CorrectAttendanceResponse,
  GetAttendanceHistoryQueryParams,
  GetAttendanceHistoryResponse,
  GetTodayAttendanceResponse,
  ListAttendanceQueryParams,
  ListAttendanceResponse,
} from "@workspace/api-zod";
import { requireAuth, requireRole } from "../middlewares/auth";
import { distanceInMeters, MAX_ACCEPTABLE_ACCURACY_METERS } from "../lib/geo";

const router: IRouter = Router();

function selectAttendanceView() {
  return db
    .select({
      id: attendanceTable.id,
      employeeId: attendanceTable.employeeId,
      employeeName: employeesTable.name,
      departmentName: departmentsTable.name,
      date: attendanceTable.date,
      checkInTime: attendanceTable.checkInTime,
      checkInLatitude: attendanceTable.checkInLatitude,
      checkInLongitude: attendanceTable.checkInLongitude,
      checkInAccuracy: attendanceTable.checkInAccuracy,
      checkOutTime: attendanceTable.checkOutTime,
      checkOutLatitude: attendanceTable.checkOutLatitude,
      checkOutLongitude: attendanceTable.checkOutLongitude,
      checkOutAccuracy: attendanceTable.checkOutAccuracy,
      workingHours: attendanceTable.workingHours,
      status: attendanceTable.status,
      locationVerified: attendanceTable.locationVerified,
      deviceInfo: attendanceTable.deviceInfo,
      notes: attendanceTable.notes,
    })
    .from(attendanceTable)
    .innerJoin(employeesTable, eq(attendanceTable.employeeId, employeesTable.id))
    .leftJoin(departmentsTable, eq(employeesTable.departmentId, departmentsTable.id));
}

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

router.get("/attendance/today", requireAuth, async (req, res): Promise<void> => {
  const employee = req.currentEmployee!;
  const [row] = await selectAttendanceView().where(
    and(eq(attendanceTable.employeeId, employee.id), eq(attendanceTable.date, todayDateString())),
  );

  if (!row) {
    res.json(
      GetTodayAttendanceResponse.parse({
        id: 0,
        employeeId: employee.id,
        employeeName: employee.name,
        departmentName: null,
        date: todayDateString(),
        checkInTime: null,
        checkInLatitude: null,
        checkInLongitude: null,
        checkInAccuracy: null,
        checkOutTime: null,
        checkOutLatitude: null,
        checkOutLongitude: null,
        checkOutAccuracy: null,
        workingHours: null,
        status: "absent",
        locationVerified: false,
        deviceInfo: null,
        notes: null,
      }),
    );
    return;
  }

  res.json(GetTodayAttendanceResponse.parse(row));
});

const LATE_THRESHOLD_MINUTES_AFTER_SHIFT_START = 15;

router.post("/attendance/check-in", requireAuth, async (req, res): Promise<void> => {
  const parsed = CheckInBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const employee = req.currentEmployee!;
  const date = todayDateString();

  const [existing] = await db
    .select()
    .from(attendanceTable)
    .where(and(eq(attendanceTable.employeeId, employee.id), eq(attendanceTable.date, date)));

  if (existing?.checkInTime) {
    res.status(400).json({ error: "You have already checked in today" });
    return;
  }

  if (!employee.officeLocationId) {
    res.status(400).json({ error: "No office location assigned to your account. Contact HR." });
    return;
  }

  const [office] = await db
    .select()
    .from(officeLocationsTable)
    .where(eq(officeLocationsTable.id, employee.officeLocationId));

  if (!office) {
    res.status(400).json({ error: "Your assigned office location could not be found. Contact HR." });
    return;
  }

  if (parsed.data.accuracy > MAX_ACCEPTABLE_ACCURACY_METERS) {
    res.status(400).json({
      error: `GPS signal is too weak (±${Math.round(parsed.data.accuracy)}m). Move to an open area and try again.`,
    });
    return;
  }

  const distance = distanceInMeters(
    parsed.data.latitude,
    parsed.data.longitude,
    office.latitude,
    office.longitude,
  );

  if (distance > office.radiusMeters) {
    res.status(400).json({
      error: `You are outside the office premises (${Math.round(distance)}m from ${office.name}).`,
    });
    return;
  }

  const now = new Date();
  let status: "present" | "late" = "present";
  if (employee.shiftStart) {
    const [h, m] = employee.shiftStart.split(":").map(Number);
    const shiftStart = new Date(now);
    shiftStart.setHours(h, m, 0, 0);
    shiftStart.setMinutes(shiftStart.getMinutes() + LATE_THRESHOLD_MINUTES_AFTER_SHIFT_START);
    if (now > shiftStart) status = "late";
  }

  let attendanceId: number;
  if (existing) {
    const [updated] = await db
      .update(attendanceTable)
      .set({
        checkInTime: now,
        checkInLatitude: parsed.data.latitude,
        checkInLongitude: parsed.data.longitude,
        checkInAccuracy: parsed.data.accuracy,
        deviceInfo: parsed.data.deviceInfo,
        locationVerified: true,
        status,
      })
      .where(eq(attendanceTable.id, existing.id))
      .returning();
    attendanceId = updated.id;
  } else {
    const [created] = await db
      .insert(attendanceTable)
      .values({
        employeeId: employee.id,
        date,
        checkInTime: now,
        checkInLatitude: parsed.data.latitude,
        checkInLongitude: parsed.data.longitude,
        checkInAccuracy: parsed.data.accuracy,
        deviceInfo: parsed.data.deviceInfo,
        locationVerified: true,
        status,
      })
      .returning();
    attendanceId = created.id;
  }

  const [row] = await selectAttendanceView().where(eq(attendanceTable.id, attendanceId));
  res.status(201).json(CheckInResponse.parse(row));
});

router.post("/attendance/check-out", requireAuth, async (req, res): Promise<void> => {
  const parsed = CheckOutBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const employee = req.currentEmployee!;
  const date = todayDateString();

  const [existing] = await db
    .select()
    .from(attendanceTable)
    .where(and(eq(attendanceTable.employeeId, employee.id), eq(attendanceTable.date, date)));

  if (!existing || !existing.checkInTime) {
    res.status(400).json({ error: "You have not checked in today" });
    return;
  }

  if (existing.checkOutTime) {
    res.status(400).json({ error: "You have already checked out today" });
    return;
  }

  const now = new Date();
  const workingHours = (now.getTime() - existing.checkInTime.getTime()) / (1000 * 60 * 60);
  const status = workingHours < 4 ? "half_day" : existing.status;

  const [updated] = await db
    .update(attendanceTable)
    .set({
      checkOutTime: now,
      checkOutLatitude: parsed.data.latitude,
      checkOutLongitude: parsed.data.longitude,
      checkOutAccuracy: parsed.data.accuracy,
      workingHours: Math.round(workingHours * 100) / 100,
      status,
    })
    .where(eq(attendanceTable.id, existing.id))
    .returning();

  const [row] = await selectAttendanceView().where(eq(attendanceTable.id, updated.id));
  res.json(CheckOutResponse.parse(row));
});

router.get("/attendance/history", requireAuth, async (req, res): Promise<void> => {
  const query = GetAttendanceHistoryQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const employee = req.currentEmployee!;
  const conditions = [eq(attendanceTable.employeeId, employee.id)];

  if (query.data.month !== undefined && query.data.year !== undefined) {
    const start = `${query.data.year}-${String(query.data.month).padStart(2, "0")}-01`;
    const endDate = new Date(query.data.year, query.data.month, 1);
    const end = endDate.toISOString().slice(0, 10);
    conditions.push(gte(attendanceTable.date, start), lt(attendanceTable.date, end));
  }

  const rows = await selectAttendanceView()
    .where(and(...conditions))
    .orderBy(desc(attendanceTable.date));

  res.json(GetAttendanceHistoryResponse.parse(rows));
});

router.get(
  "/attendance",
  requireAuth,
  requireRole("hr", "admin"),
  async (req, res): Promise<void> => {
    const query = ListAttendanceQueryParams.safeParse(req.query);
    if (!query.success) {
      res.status(400).json({ error: query.error.message });
      return;
    }

    const conditions = [];
    if (query.data.date) {
      conditions.push(eq(attendanceTable.date, query.data.date.toISOString().slice(0, 10)));
    }
    if (query.data.status) {
      conditions.push(eq(attendanceTable.status, query.data.status));
    }
    if (query.data.employeeId !== undefined) {
      conditions.push(eq(attendanceTable.employeeId, query.data.employeeId));
    }
    if (query.data.departmentId !== undefined) {
      conditions.push(eq(employeesTable.departmentId, query.data.departmentId));
    }

    const rows = await selectAttendanceView()
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(attendanceTable.date));

    res.json(ListAttendanceResponse.parse(rows));
  },
);

router.patch(
  "/attendance/:id",
  requireAuth,
  requireRole("hr", "admin"),
  async (req, res): Promise<void> => {
    const params = CorrectAttendanceParams.safeParse(req.params);
    const parsed = CorrectAttendanceBody.safeParse(req.body);
    if (!params.success || !parsed.success) {
      res.status(400).json({ error: (params.error ?? parsed.error)!.message });
      return;
    }

    const [existing] = await db
      .select()
      .from(attendanceTable)
      .where(eq(attendanceTable.id, params.data.id));

    if (!existing) {
      res.status(404).json({ error: "Attendance record not found" });
      return;
    }

    const checkInTime = parsed.data.checkInTime ?? existing.checkInTime;
    const checkOutTime = parsed.data.checkOutTime ?? existing.checkOutTime;
    let workingHours = existing.workingHours;
    if (checkInTime && checkOutTime) {
      workingHours =
        Math.round(((checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60)) * 100) / 100;
    }

    const [updated] = await db
      .update(attendanceTable)
      .set({
        checkInTime,
        checkOutTime,
        status: parsed.data.status ?? existing.status,
        notes: parsed.data.notes ?? existing.notes,
        workingHours,
      })
      .where(eq(attendanceTable.id, params.data.id))
      .returning();

    const [row] = await selectAttendanceView().where(eq(attendanceTable.id, updated.id));
    res.json(CorrectAttendanceResponse.parse(row));
  },
);

export default router;
