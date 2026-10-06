import { Router } from "express";
import { uploadMaterial, listMaterials, deleteMaterial } from "../controllers/material.controller";
import { authenticate, authorize } from "../middleware/auth";
import { uploadMaterial as uploadMiddleware } from "../middleware/upload";

const router = Router();
router.use(authenticate);

router.post("/", authorize("INSTITUTE_ADMIN", "TEACHER"), uploadMiddleware, uploadMaterial);
router.get("/", listMaterials);
router.delete("/:id", authorize("INSTITUTE_ADMIN", "TEACHER"), deleteMaterial);

export default router;
