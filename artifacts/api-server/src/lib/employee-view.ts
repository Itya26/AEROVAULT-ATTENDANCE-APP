import { eq } from "drizzle-orm";
import { db, departmentsTable, employeesTable, officeLocationsTable } from "@workspace/db";

export interface EmployeeView {
  id: number;
  employeeId: string;
  name: string;
  email: string;
  phone: string | null;
  role: "employee" | "hr" | "admin";
  departmentId: number | null;
  departmentName: string | null;
  officeLocationId: number | null;
  officeLocationName: string | null;
  shiftStart: string | null;
  shiftEnd: string | null;
  isActive: boolean;
  createdAt: Date;
}

function selectEmployeeView() {
  return db
    .select({
      id: employeesTable.id,
      employeeId: employeesTable.employeeId,
      name: employeesTable.name,
      email: employeesTable.email,
      phone: employeesTable.phone,
      role: employeesTable.role,
      departmentId: employeesTable.departmentId,
      departmentName: departmentsTable.name,
      officeLocationId: employeesTable.officeLocationId,
      officeLocationName: officeLocationsTable.name,
      shiftStart: employeesTable.shiftStart,
      shiftEnd: employeesTable.shiftEnd,
      isActive: employeesTable.isActive,
      createdAt: employeesTable.createdAt,
    })
    .from(employeesTable)
    .leftJoin(departmentsTable, eq(employeesTable.departmentId, departmentsTable.id))
    .leftJoin(officeLocationsTable, eq(employeesTable.officeLocationId, officeLocationsTable.id));
}

export async function getEmployeeViewById(id: number): Promise<EmployeeView | null> {
  const [row] = await selectEmployeeView().where(eq(employeesTable.id, id));
  return row ?? null;
}

export async function listEmployeeViews(): Promise<EmployeeView[]> {
  return selectEmployeeView();
}
