import { Router } from "express";
import {
  createInstitute, getInstitute, updateInstitute, getDashboard,
  createSubject, listSubjects, createClass, listClasses, assignSubjectToClass,
} from "../controllers/institute.controller";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.post("/", authorize("SUPER_ADMIN"), createInstitute);
router.get("/:id", getInstitute);
router.patch("/:id", authorize("INSTITUTE_ADMIN", "SUPER_ADMIN"), updateInstitute);
router.get("/:id/dashboard", authorize("INSTITUTE_ADMIN", "SUPER_ADMIN"), getDashboard);

// Subjects
router.post("/subjects", authorize("INSTITUTE_ADMIN"), createSubject);
router.get("/subjects/list", listSubjects);

// Classes
router.post("/classes", authorize("INSTITUTE_ADMIN"), createClass);
router.get("/classes/list", listClasses);
router.post("/classes/:classId/subjects", authorize("INSTITUTE_ADMIN"), assignSubjectToClass);

export default router;
