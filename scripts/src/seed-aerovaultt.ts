import bcrypt from "bcryptjs";
import {
  attendanceTable,
  db,
  departmentsTable,
  employeesTable,
  officeLocationsTable,
} from "@workspace/db";

async function main() {
  console.log("Seeding AEROVAULTT data...");

  const [engineering] = await db
    .insert(departmentsTable)
    .values({ name: "Engineering" })
    .returning();
  const [operations] = await db
    .insert(departmentsTable)
    .values({ name: "Operations" })
    .returning();

  const [hq] = await db
    .insert(officeLocationsTable)
    .values({
      name: "AEROVAULTT HQ",
      latitude: 12.9716,
      longitude: 77.5946,
      radiusMeters: 200,
    })
    .returning();

  const password = await bcrypt.hash("Aero@123", 10);

  const [admin] = await db
    .insert(employeesTable)
    .values({
      employeeId: "AV-ADMIN-001",
      name: "Ananya Rao",
      email: "ananya.rao@aerovaultt.com",
      phone: "+91 90000 00001",
      passwordHash: password,
      role: "admin",
      departmentId: operations.id,
      officeLocationId: hq.id,
      shiftStart: "09:00",
      shiftEnd: "18:00",
    })
    .returning();

  const [hr] = await db
    .insert(employeesTable)
    .values({
      employeeId: "AV-HR-001",
      name: "Meera Iyer",
      email: "meera.iyer@aerovaultt.com",
      phone: "+91 90000 00002",
      passwordHash: password,
      role: "hr",
      departmentId: operations.id,
      officeLocationId: hq.id,
      shiftStart: "09:00",
      shiftEnd: "18:00",
    })
    .returning();

  const [emp1] = await db
    .insert(employeesTable)
    .values({
      employeeId: "AV-EMP-001",
      name: "Rahul Verma",
      email: "rahul.verma@aerovaultt.com",
      phone: "+91 90000 00003",
      passwordHash: password,
      role: "employee",
      departmentId: engineering.id,
      officeLocationId: hq.id,
      shiftStart: "09:30",
      shiftEnd: "18:30",
    })
    .returning();

  const [emp2] = await db
    .insert(employeesTable)
    .values({
      employeeId: "AV-EMP-002",
      name: "Sneha Kapoor",
      email: "sneha.kapoor@aerovaultt.com",
      phone: "+91 90000 00004",
      passwordHash: password,
      role: "employee",
      departmentId: engineering.id,
      officeLocationId: hq.id,
      shiftStart: "09:30",
      shiftEnd: "18:30",
    })
    .returning();

  const today = new Date().toISOString().slice(0, 10);
  const checkIn = new Date();
  checkIn.setHours(9, 25, 0, 0);

  await db.insert(attendanceTable).values({
    employeeId: emp1.id,
    date: today,
    checkInTime: checkIn,
    checkInLatitude: hq.latitude,
    checkInLongitude: hq.longitude,
    checkInAccuracy: 12,
    locationVerified: true,
    status: "present",
    deviceInfo: "seed-script",
  });

  console.log("Seed complete.");
  console.log("Login credentials (password: Aero@123 for all):");
  console.log(`  Admin: ${admin.employeeId}`);
  console.log(`  HR:    ${hr.employeeId}`);
  console.log(`  Employee: ${emp1.employeeId}`);
  console.log(`  Employee: ${emp2.employeeId}`);

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
