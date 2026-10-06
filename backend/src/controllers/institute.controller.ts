import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/database";

const InstituteSchema = z.object({
  name: z.string().min(2),
  timezone: z.string().optional(),
  whatsappTemplate: z.string().optional(),
});

/** POST /api/institutes */
export async function createInstitute(req: Request, res: Response) {
  const data = InstituteSchema.parse(req.body);
  const institute = await prisma.institute.create({ data });
  return res.status(201).json(institute);
}

/** GET /api/institutes/:id */
export async function getInstitute(req: Request, res: Response) {
  const institute = await prisma.institute.findUniqueOrThrow({
    where: { id: req.params.id },
    include: { branches: true },
  });
  return res.json(institute);
}

/** PATCH /api/institutes/:id */
export async function updateInstitute(req: Request, res: Response) {
  const data = InstituteSchema.partial().parse(req.body);
  const institute = await prisma.institute.update({
    where: { id: req.params.id },
    data,
  });
  return res.json(institute);
}

/** GET /api/institutes/:id/dashboard — workload, class count, teacher count */
export async function getDashboard(req: Request, res: Response) {
  const instituteId = req.params.id;

  const [teachers, students, classes, pendingRequests] = await Promise.all([
    prisma.teacher.count({ where: { instituteId } }),
    prisma.student.count({ where: { instituteId } }),
    prisma.class.count({ where: { instituteId } }),
    prisma.changeRequest.count({ where: { status: "PENDING", teacher: { instituteId } } }),
  ]);

  // Teacher workload: count lectures per teacher this week
  const weekStart = getWeekStart();
  const workload = await prisma.lecture.groupBy({
    by: ["teacherId"],
    where: {
      isCancelled: false,
      timetable: { isActive: true, weekStart },
    },
    _count: { id: true },
  });

  return res.json({ teachers, students, classes, pendingRequests, workload });
}

// ─── Subjects ─────────────────────────────────────────────────────────────────

const SubjectSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  color: z.string().optional(),
});

export async function createSubject(req: Request, res: Response) {
  const data = SubjectSchema.parse(req.body);
  const subject = await prisma.subject.create({
    data: { ...data, instituteId: req.user!.instituteId! },
  });
  return res.status(201).json(subject);
}

export async function listSubjects(req: Request, res: Response) {
  const subjects = await prisma.subject.findMany({
    where: { instituteId: req.user!.instituteId! },
    orderBy: { name: "asc" },
  });
  return res.json(subjects);
}

// ─── Classes ──────────────────────────────────────────────────────────────────

const ClassSchema = z.object({
  name: z.string().min(1),
  shift: z.enum(["MORNING", "AFTERNOON", "EVENING"]),
  lectureDuration: z.number().int().min(30).max(120).optional(),
  branchId: z.string().optional(),
});

export async function createClass(req: Request, res: Response) {
  const data = ClassSchema.parse(req.body);
  const cls = await prisma.class.create({
    data: { ...data, instituteId: req.user!.instituteId! },
  });
  return res.status(201).json(cls);
}

export async function listClasses(req: Request, res: Response) {
  const classes = await prisma.class.findMany({
    where: { instituteId: req.user!.instituteId! },
    include: { classSubjects: { include: { subject: true } }, _count: { select: { students: true } } },
    orderBy: { name: "asc" },
  });
  return res.json(classes);
}

/** POST /api/classes/:classId/subjects — assign subject + teacher to class */
const ClassSubjectSchema = z.object({
  subjectId: z.string(),
  lecturesPerWeek: z.number().int().min(1).max(10),
  teacherId: z.string(),
  lecturesRequired: z.number().int().min(1).optional(),
});

export async function assignSubjectToClass(req: Request, res: Response) {
  const { classId } = req.params;
  const data = ClassSubjectSchema.parse(req.body);

  const [cs, ts] = await prisma.$transaction([
    prisma.classSubject.upsert({
      where: { classId_subjectId: { classId, subjectId: data.subjectId } },
      create: { classId, subjectId: data.subjectId, lecturesPerWeek: data.lecturesPerWeek },
      update: { lecturesPerWeek: data.lecturesPerWeek },
    }),
    prisma.teacherSubject.upsert({
      where: {
        teacherId_subjectId_classId: {
          teacherId: data.teacherId,
          subjectId: data.subjectId,
          classId,
        },
      },
      create: {
        teacherId: data.teacherId,
        subjectId: data.subjectId,
        classId,
        lecturesRequired: data.lecturesRequired ?? data.lecturesPerWeek,
      },
      update: { lecturesRequired: data.lecturesRequired ?? data.lecturesPerWeek },
    }),
  ]);

  return res.status(201).json({ classSubject: cs, teacherSubject: ts });
}

// ─── helper ───────────────────────────────────────────────────────────────────
function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
