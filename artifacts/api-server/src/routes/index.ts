import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import employeesRouter from "./employees";
import departmentsRouter from "./departments";
import officeLocationsRouter from "./office-locations";
import attendanceRouter from "./attendance";
import leavesRouter from "./leaves";
import holidaysRouter from "./holidays";
import notificationsRouter from "./notifications";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(employeesRouter);
router.use(departmentsRouter);
router.use(officeLocationsRouter);
router.use(attendanceRouter);
router.use(leavesRouter);
router.use(holidaysRouter);
router.use(notificationsRouter);
router.use(dashboardRouter);

export default router;
