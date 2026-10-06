import { Router } from "express";
import { generateSchedule, getTimetable, moveLecture, reportAbsence } from "../controllers/schedule.controller";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();
router.use(authenticate);

router.post("/generate/:classId", authorize("INSTITUTE_ADMIN"), generateSchedule);
router.get("/:classId", getTimetable);
router.patch("/lectures/:lectureId", authorize("INSTITUTE_ADMIN"), moveLecture);
router.post("/absence", authorize("INSTITUTE_ADMIN", "TEACHER"), reportAbsence);

export default router;
