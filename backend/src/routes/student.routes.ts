import { Router } from "express";
import { listStudents, updateStudent, getStudentSchedule, addPersonalEvent } from "../controllers/student.controller";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();
router.use(authenticate);

router.get("/", authorize("INSTITUTE_ADMIN", "TEACHER"), listStudents);
router.patch("/:id", updateStudent);
router.get("/:id/schedule", getStudentSchedule);
router.post("/:id/events", addPersonalEvent);

export default router;
