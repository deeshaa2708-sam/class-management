import { Router } from "express";
import authRoutes from "./auth.routes";
import instituteRoutes from "./institute.routes";
import teacherRoutes from "./teacher.routes";
import studentRoutes from "./student.routes";
import scheduleRoutes from "./schedule.routes";
import attendanceRoutes from "./attendance.routes";
import materialRoutes from "./material.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/institutes", instituteRoutes);
router.use("/teachers", teacherRoutes);
router.use("/students", studentRoutes);
router.use("/schedules", scheduleRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/materials", materialRoutes);

export default router;
