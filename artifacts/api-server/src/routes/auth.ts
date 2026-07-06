import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, employeesTable } from "@workspace/db";
import {
  ChangePasswordBody,
  ChangePasswordResponse,
  GetCurrentUserResponse,
  LoginBody,
  LoginResponse,
} from "@workspace/api-zod";
import { signToken } from "../lib/jwt";
import { requireAuth } from "../middlewares/auth";
import { getEmployeeViewById } from "../lib/employee-view";

const router: IRouter = Router();

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [employee] = await db
    .select()
    .from(employeesTable)
    .where(eq(employeesTable.employeeId, parsed.data.employeeId));

  if (!employee || !employee.isActive) {
    res.status(401).json({ error: "Invalid employee ID or password" });
    return;
  }

  const passwordMatches = await bcrypt.compare(parsed.data.password, employee.passwordHash);
  if (!passwordMatches) {
    res.status(401).json({ error: "Invalid employee ID or password" });
    return;
  }

  const token = signToken({ employeeId: employee.id, role: employee.role });
  const user = await getEmployeeViewById(employee.id);

  res.json(LoginResponse.parse({ token, user }));
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const user = await getEmployeeViewById(req.currentEmployee!.id);
  res.json(GetCurrentUserResponse.parse(user));
});

router.post("/auth/change-password", requireAuth, async (req, res): Promise<void> => {
  const parsed = ChangePasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const employee = req.currentEmployee!;
  const passwordMatches = await bcrypt.compare(parsed.data.currentPassword, employee.passwordHash);
  if (!passwordMatches) {
    res.status(401).json({ error: "Current password is incorrect" });
    return;
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await db.update(employeesTable).set({ passwordHash }).where(eq(employeesTable.id, employee.id));

  res.json(ChangePasswordResponse.parse({ message: "Password changed successfully" }));
});

export default router;
