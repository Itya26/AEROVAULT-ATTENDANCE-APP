import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { db, employeesTable } from "@workspace/db";
import {
  CreateEmployeeBody,
  CreateEmployeeResponse,
  DeactivateEmployeeBody,
  DeactivateEmployeeParams,
  DeactivateEmployeeResponse,
  GetEmployeeParams,
  GetEmployeeResponse,
  ListEmployeesQueryParams,
  ListEmployeesResponse,
  ResetEmployeePasswordBody,
  ResetEmployeePasswordParams,
  ResetEmployeePasswordResponse,
  UpdateEmployeeBody,
  UpdateEmployeeParams,
  UpdateEmployeeResponse,
} from "@workspace/api-zod";
import { requireAuth, requireRole } from "../middlewares/auth";
import { getEmployeeViewById, listEmployeeViews } from "../lib/employee-view";

const router: IRouter = Router();

router.get(
  "/employees",
  requireAuth,
  requireRole("hr", "admin"),
  async (req, res): Promise<void> => {
    const query = ListEmployeesQueryParams.safeParse(req.query);
    if (!query.success) {
      res.status(400).json({ error: query.error.message });
      return;
    }

    let rows = await listEmployeeViews();
    if (query.data.departmentId !== undefined) {
      rows = rows.filter((row) => row.departmentId === query.data.departmentId);
    }
    if (query.data.isActive !== undefined) {
      rows = rows.filter((row) => row.isActive === query.data.isActive);
    }

    res.json(ListEmployeesResponse.parse(rows));
  },
);

router.post("/employees", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const parsed = CreateEmployeeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(employeesTable)
    .where(eq(employeesTable.employeeId, parsed.data.employeeId));
  if (existing) {
    res.status(400).json({ error: "An employee with this Employee ID already exists" });
    return;
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const { password: _password, ...rest } = parsed.data;
  const [created] = await db
    .insert(employeesTable)
    .values({ ...rest, passwordHash })
    .returning();

  const view = await getEmployeeViewById(created.id);
  res.status(201).json(CreateEmployeeResponse.parse(view));
});

router.get("/employees/:id", requireAuth, requireRole("hr", "admin"), async (req, res): Promise<void> => {
  const params = GetEmployeeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const view = await getEmployeeViewById(params.data.id);
  if (!view) {
    res.status(404).json({ error: "Employee not found" });
    return;
  }

  res.json(GetEmployeeResponse.parse(view));
});

router.patch("/employees/:id", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const params = UpdateEmployeeParams.safeParse(req.params);
  const parsed = UpdateEmployeeBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: (params.error ?? parsed.error)!.message });
    return;
  }

  const [updated] = await db
    .update(employeesTable)
    .set(parsed.data)
    .where(eq(employeesTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Employee not found" });
    return;
  }

  const view = await getEmployeeViewById(updated.id);
  res.json(UpdateEmployeeResponse.parse(view));
});

router.post(
  "/employees/:id/reset-password",
  requireAuth,
  requireRole("admin"),
  async (req, res): Promise<void> => {
    const params = ResetEmployeePasswordParams.safeParse(req.params);
    const parsed = ResetEmployeePasswordBody.safeParse(req.body);
    if (!params.success || !parsed.success) {
      res.status(400).json({ error: (params.error ?? parsed.error)!.message });
      return;
    }

    const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
    const [updated] = await db
      .update(employeesTable)
      .set({ passwordHash })
      .where(eq(employeesTable.id, params.data.id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Employee not found" });
      return;
    }

    res.json(ResetEmployeePasswordResponse.parse({ message: "Password reset successfully" }));
  },
);

router.post(
  "/employees/:id/deactivate",
  requireAuth,
  requireRole("admin"),
  async (req, res): Promise<void> => {
    const params = DeactivateEmployeeParams.safeParse(req.params);
    const parsed = DeactivateEmployeeBody.safeParse(req.body);
    if (!params.success || !parsed.success) {
      res.status(400).json({ error: (params.error ?? parsed.error)!.message });
      return;
    }

    const [updated] = await db
      .update(employeesTable)
      .set({ isActive: parsed.data.isActive })
      .where(and(eq(employeesTable.id, params.data.id)))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Employee not found" });
      return;
    }

    const view = await getEmployeeViewById(updated.id);
    res.json(DeactivateEmployeeResponse.parse(view));
  },
);

export default router;
