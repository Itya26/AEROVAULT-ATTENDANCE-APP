import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, officeLocationsTable } from "@workspace/db";
import {
  CreateOfficeLocationBody,
  CreateOfficeLocationResponse,
  DeleteOfficeLocationParams,
  ListOfficeLocationsResponse,
  UpdateOfficeLocationBody,
  UpdateOfficeLocationParams,
  UpdateOfficeLocationResponse,
} from "@workspace/api-zod";
import { requireAuth, requireRole } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/office-locations", requireAuth, async (_req, res): Promise<void> => {
  const rows = await db.select().from(officeLocationsTable).orderBy(officeLocationsTable.name);
  res.json(ListOfficeLocationsResponse.parse(rows));
});

router.post(
  "/office-locations",
  requireAuth,
  requireRole("admin"),
  async (req, res): Promise<void> => {
    const parsed = CreateOfficeLocationBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [location] = await db.insert(officeLocationsTable).values(parsed.data).returning();
    res.status(201).json(CreateOfficeLocationResponse.parse(location));
  },
);

router.patch(
  "/office-locations/:id",
  requireAuth,
  requireRole("admin"),
  async (req, res): Promise<void> => {
    const params = UpdateOfficeLocationParams.safeParse(req.params);
    const parsed = UpdateOfficeLocationBody.safeParse(req.body);
    if (!params.success || !parsed.success) {
      res.status(400).json({ error: (params.error ?? parsed.error)!.message });
      return;
    }

    const [location] = await db
      .update(officeLocationsTable)
      .set(parsed.data)
      .where(eq(officeLocationsTable.id, params.data.id))
      .returning();

    if (!location) {
      res.status(404).json({ error: "Office location not found" });
      return;
    }

    res.json(UpdateOfficeLocationResponse.parse(location));
  },
);

router.delete(
  "/office-locations/:id",
  requireAuth,
  requireRole("admin"),
  async (req, res): Promise<void> => {
    const params = DeleteOfficeLocationParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    await db.delete(officeLocationsTable).where(eq(officeLocationsTable.id, params.data.id));
    res.sendStatus(204);
  },
);

export default router;
