import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/database";
import { timesOverlap } from "../utils/helpers";
import { Day } from "@prisma/client";

export async function listStudents(req: Request, res: Response) {
  const { classId } = req.query as { classId?: string };
  const students = await prisma.student.findMany({
    where: { instituteId: req.user!.instituteId!, ...(classId ? { classId } : {}) },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      class: { select: { name: true, shift: true } },
    },
    orderBy: { user: { name: "asc" } },
  });
  return res.json(students);
}

/** PATCH /api/students/:id — update parent WhatsApp number */
const UpdateStudentSchema = z.object({
  parentWhatsapp: z.string().regex(/^\+\d{10,15}$/, "Must be E.164 format").optional(),
  rollNumber: z.string().optional(),
  classId: z.string().optional(),
});

export async function updateStudent(req: Request, res: Response) {
  const data = UpdateStudentSchema.parse(req.body);
  const student = await prisma.student.update({
    where: { id: req.params.id },
    data,
    include: { user: { select: { name: true, email: true } } },
  });
  return res.json(student);
}

/** GET /api/students/:id/schedule — personal daily planner */
export async function getStudentSchedule(req: Request, res: Response) {
  const student = await prisma.student.findUniqueOrThrow({
    where: { id: req.params.id },
    include: { class: true },
  });

  const weekStart = getWeekStart();
  const timetable = await prisma.timetable.findFirst({
    where: { classId: student.classId, weekStart, isActive: true },
    include: {
      lectures: {
        where: { isCancelled: false },
        orderBy: [{ day: "asc" }, { startTime: "asc" }],
        include: { subject: true, teacher: { include: { user: { select: { name: true } } } } },
      },
    },
  });

  const personalEvents = await prisma.personalEvent.findMany({
    where: { studentId: req.params.id },
    orderBy: { startTime: "asc" },
  });

  return res.json({ timetable, personalEvents });
}

/** POST /api/students/:id/events — add personal event with conflict detection */
const EventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
});

export async function addPersonalEvent(req: Request, res: Response) {
  const data = EventSchema.parse(req.body);
  const studentId = req.params.id;

  const student = await prisma.student.findUniqueOrThrow({ where: { id: studentId } });
  const weekStart = getWeekStart(new Date(data.startTime));
  const eventDay = getDayEnum(new Date(data.startTime));
  const eventStart = new Date(data.startTime)
    .toTimeString()
    .slice(0, 5);
  const eventEnd = new Date(data.endTime)
    .toTimeString()
    .slice(0, 5);

  // Check if event conflicts with any class lecture
  const timetable = await prisma.timetable.findFirst({
    where: { classId: student.classId, weekStart, isActive: true },
    include: {
      lectures: {
        where: { day: eventDay, isCancelled: false },
      },
    },
  });

  const hasConflict =
    timetable?.lectures.some((l) =>
      timesOverlap(l.startTime, l.endTime, eventStart, eventEnd)
    ) ?? false;

  const event = await prisma.personalEvent.create({
    data: {
      studentId,
      title: data.title,
      description: data.description,
      startTime: new Date(data.startTime),
      endTime: new Date(data.endTime),
      hasConflict,
    },
  });

  return res.status(201).json({ event, hasConflict });
}

// ─── helpers ──────────────────────────────────────────────────────────────────
function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

const DAY_MAP: Record<number, Day> = {
  0: Day.SUNDAY, 1: Day.MONDAY, 2: Day.TUESDAY, 3: Day.WEDNESDAY,
  4: Day.THURSDAY, 5: Day.FRIDAY, 6: Day.SATURDAY,
};
function getDayEnum(d: Date): Day { return DAY_MAP[d.getDay()]; }
