import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db, employeesTable, leavesTable } from "@workspace/db";
import {
  CreateLeaveBody,
  CreateLeaveResponse,
  ListLeavesQueryParams,
  ListLeavesResponse,
  ReviewLeaveBody,
  ReviewLeaveParams,
  ReviewLeaveResponse,
} from "@workspace/api-zod";
import { requireAuth, requireRole } from "../middlewares/auth";

const router: IRouter = Router();

function selectLeaveView() {
  return db
    .select({
      id: leavesTable.id,
      employeeId: leavesTable.employeeId,
      employeeName: employeesTable.name,
      type: leavesTable.type,
      startDate: leavesTable.startDate,
      endDate: leavesTable.endDate,
      reason: leavesTable.reason,
      attachmentUrl: leavesTable.attachmentUrl,
      status: leavesTable.status,
      reviewNotes: leavesTable.reviewNotes,
      createdAt: leavesTable.createdAt,
    })
    .from(leavesTable)
    .innerJoin(employeesTable, eq(leavesTable.employeeId, employeesTable.id));
}

router.get("/leaves", requireAuth, async (req, res): Promise<void> => {
  const query = ListLeavesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const employee = req.currentEmployee!;
  const isPrivileged = employee.role === "hr" || employee.role === "admin";
  const conditions = [];

  if (!isPrivileged) {
    conditions.push(eq(leavesTable.employeeId, employee.id));
  } else if (query.data.employeeId !== undefined) {
    conditions.push(eq(leavesTable.employeeId, query.data.employeeId));
  }

  if (query.data.status) {
    conditions.push(eq(leavesTable.status, query.data.status));
  }

  const rows = await selectLeaveView()
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(leavesTable.createdAt));

  res.json(ListLeavesResponse.parse(rows));
});

router.post("/leaves", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateLeaveBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const employee = req.currentEmployee!;
  const [created] = await db
    .insert(leavesTable)
    .values({
      employeeId: employee.id,
      type: parsed.data.type,
      startDate: parsed.data.startDate.toISOString().slice(0, 10),
      endDate: parsed.data.endDate.toISOString().slice(0, 10),
      reason: parsed.data.reason,
      attachmentUrl: parsed.data.attachmentUrl,
    })
    .returning();

  const [row] = await selectLeaveView().where(eq(leavesTable.id, created.id));
  res.status(201).json(CreateLeaveResponse.parse(row));
});

router.patch(
  "/leaves/:id",
  requireAuth,
  requireRole("hr", "admin"),
  async (req, res): Promise<void> => {
    const params = ReviewLeaveParams.safeParse(req.params);
    const parsed = ReviewLeaveBody.safeParse(req.body);
    if (!params.success || !parsed.success) {
      res.status(400).json({ error: (params.error ?? parsed.error)!.message });
      return;
    }

    const reviewer = req.currentEmployee!;
    const [updated] = await db
      .update(leavesTable)
      .set({
        status: parsed.data.status,
        reviewNotes: parsed.data.reviewNotes,
        reviewedBy: reviewer.id,
        reviewedAt: new Date(),
      })
      .where(eq(leavesTable.id, params.data.id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Leave request not found" });
      return;
    }

    const [row] = await selectLeaveView().where(eq(leavesTable.id, updated.id));
    res.json(ReviewLeaveResponse.parse(row));
  },
);

export default router;
