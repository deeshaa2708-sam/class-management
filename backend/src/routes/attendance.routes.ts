import { Router } from "express";
import { uploadAttendance, getStudentAttendance, getNotificationLogs } from "../controllers/attendance.controller";
import { authenticate, authorize } from "../middleware/auth";
import { uploadExcel } from "../middleware/upload";

const router = Router();
router.use(authenticate);

router.post("/upload", authorize("INSTITUTE_ADMIN", "TEACHER"), uploadExcel, uploadAttendance);
router.get("/student/:studentId", getStudentAttendance);
router.get("/logs", authorize("INSTITUTE_ADMIN"), getNotificationLogs);

export default router;
