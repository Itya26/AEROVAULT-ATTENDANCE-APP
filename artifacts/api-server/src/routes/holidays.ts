import { Router, type IRouter } from "express";
import { asc, eq } from "drizzle-orm";
import { db, holidaysTable } from "@workspace/db";
import {
  CreateHolidayBody,
  CreateHolidayResponse,
  DeleteHolidayParams,
  ListHolidaysResponse,
} from "@workspace/api-zod";
import { requireAuth, requireRole } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/holidays", requireAuth, async (_req, res): Promise<void> => {
  const rows = await db.select().from(holidaysTable).orderBy(asc(holidaysTable.date));
  res.json(ListHolidaysResponse.parse(rows));
});

router.post("/holidays", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const parsed = CreateHolidayBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [created] = await db
    .insert(holidaysTable)
    .values({ name: parsed.data.name, date: parsed.data.date.toISOString().slice(0, 10) })
    .returning();

  res.status(201).json(CreateHolidayResponse.parse(created));
});

router.delete("/holidays/:id", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const params = DeleteHolidayParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(holidaysTable).where(eq(holidaysTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
