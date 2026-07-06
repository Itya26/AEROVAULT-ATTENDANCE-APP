import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, departmentsTable, employeesTable } from "@workspace/db";
import {
  CreateDepartmentBody,
  CreateDepartmentResponse,
  DeleteDepartmentParams,
  ListDepartmentsResponse,
  UpdateDepartmentBody,
  UpdateDepartmentParams,
  UpdateDepartmentResponse,
} from "@workspace/api-zod";
import { requireAuth, requireRole } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/departments", requireAuth, async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: departmentsTable.id,
      name: departmentsTable.name,
      employeeCount: sql<number>`count(${employeesTable.id})::int`,
    })
    .from(departmentsTable)
    .leftJoin(employeesTable, eq(employeesTable.departmentId, departmentsTable.id))
    .groupBy(departmentsTable.id)
    .orderBy(departmentsTable.name);

  res.json(ListDepartmentsResponse.parse(rows));
});

router.post("/departments", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const parsed = CreateDepartmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [department] = await db.insert(departmentsTable).values(parsed.data).returning();
  res.status(201).json(CreateDepartmentResponse.parse({ ...department, employeeCount: 0 }));
});

router.patch("/departments/:id", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const params = UpdateDepartmentParams.safeParse(req.params);
  const parsed = UpdateDepartmentBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: (params.error ?? parsed.error)!.message });
    return;
  }

  const [department] = await db
    .update(departmentsTable)
    .set(parsed.data)
    .where(eq(departmentsTable.id, params.data.id))
    .returning();

  if (!department) {
    res.status(404).json({ error: "Department not found" });
    return;
  }

  const [{ employeeCount }] = await db
    .select({ employeeCount: sql<number>`count(*)::int` })
    .from(employeesTable)
    .where(eq(employeesTable.departmentId, department.id));

  res.json(UpdateDepartmentResponse.parse({ ...department, employeeCount }));
});

router.delete("/departments/:id", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const params = DeleteDepartmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(departmentsTable).where(eq(departmentsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
