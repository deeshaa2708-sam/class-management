import { Router } from "express";
import { listTeachers, getTeacher, setAvailability, getWorkload } from "../controllers/teacher.controller";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();
router.use(authenticate);

router.get("/", listTeachers);
router.get("/:id", getTeacher);
router.patch("/:id/availability", authorize("INSTITUTE_ADMIN", "TEACHER"), setAvailability);
router.get("/:id/workload", getWorkload);

export default router;
