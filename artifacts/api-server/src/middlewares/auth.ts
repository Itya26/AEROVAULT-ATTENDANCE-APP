import type { NextFunction, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { db, employeesTable, type Employee } from "@workspace/db";
import { verifyToken } from "../lib/jwt";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      currentEmployee?: Employee;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;

  if (!token) {
    res.status(401).json({ error: "Missing bearer token" });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  const [employee] = await db
    .select()
    .from(employeesTable)
    .where(eq(employeesTable.id, payload.employeeId));

  if (!employee || !employee.isActive) {
    res.status(401).json({ error: "Account not found or deactivated" });
    return;
  }

  req.currentEmployee = employee;
  next();
}

export function requireRole(...roles: Array<"employee" | "hr" | "admin">) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.currentEmployee || !roles.includes(req.currentEmployee.role)) {
      res.status(403).json({ error: "You do not have permission to perform this action" });
      return;
    }
    next();
  };
}
