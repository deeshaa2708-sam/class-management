import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/database";
import fs from "fs";
import path from "path";

const MaterialMetaSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  subjectId: z.string(),
  classIds: z.string(), // JSON array string from multipart
});

export async function uploadMaterial(req: Request, res: Response) {
  if (!req.file) return res.status(400).json({ message: "No file provided" });

  const data = MaterialMetaSchema.parse(req.body);
  const classIds: string[] = JSON.parse(data.classIds);

  const material = await prisma.material.create({
    data: {
      title: data.title,
      description: data.description,
      fileUrl: `/uploads/${path.basename(req.file.path)}`,
      fileType: req.file.mimetype,
      subjectId: data.subjectId,
      uploadedBy: req.user!.userId,
      instituteId: req.user!.instituteId!,
      classIds,
    },
    include: { subject: { select: { name: true, color: true } } },
  });

  return res.status(201).json(material);
}

export async function listMaterials(req: Request, res: Response) {
  const { subjectId, classId } = req.query as { subjectId?: string; classId?: string };

  const materials = await prisma.material.findMany({
    where: {
      instituteId: req.user!.instituteId!,
      ...(subjectId ? { subjectId } : {}),
      ...(classId ? { classIds: { has: classId } } : {}),
    },
    include: { subject: { select: { name: true, color: true } } },
    orderBy: { createdAt: "desc" },
  });

  return res.json(materials);
}

export async function deleteMaterial(req: Request, res: Response) {
  const material = await prisma.material.findUniqueOrThrow({
    where: { id: req.params.id },
  });

  // Remove file from disk
  const filePath = path.join(process.cwd(), material.fileUrl);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  await prisma.material.delete({ where: { id: req.params.id } });
  return res.json({ message: "Material deleted" });
}
