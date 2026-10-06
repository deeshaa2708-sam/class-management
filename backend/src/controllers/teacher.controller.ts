import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/database";
import { Day } from "@prisma/client";

const AvailabilitySchema = z.array(
  z.object({
    day: z.nativeEnum(Day),
    startTime: z.string(),
    endTime: z.string(),
  })
);

export async function listTeachers(req: Request, res: Response) {
  const teachers = await prisma.teacher.findMany({
    where: { instituteId: req.user!.instituteId! },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      teacherSubjects: { include: { subject: true } },
      availability: true,
    },
    orderBy: { user: { name: "asc" } },
  });
  return res.json(teachers);
}

export async function getTeacher(req: Request, res: Response) {
  const teacher = await prisma.teacher.findUniqueOrThrow({
    where: { id: req.params.id },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      teacherSubjects: { include: { subject: true } },
      availability: true,
    },
  });
  return res.json(teacher);
}

/** PATCH /api/teachers/:id/availability — replace all availability slots */
export async function setAvailability(req: Request, res: Response) {
  const slots = AvailabilitySchema.parse(req.body);
  const { id: teacherId } = req.params;

  await prisma.$transaction([
    prisma.teacherAvailability.deleteMany({ where: { teacherId } }),
    prisma.teacherAvailability.createMany({
      data: slots.map((s) => ({ teacherId, ...s })),
    }),
  ]);

  const updated = await prisma.teacherAvailability.findMany({ where: { teacherId } });
  return res.json(updated);
}

/** GET /api/teachers/:id/workload */
export async function getWorkload(req: Request, res: Response) {
  const weekStart = getWeekStart();
  const lectures = await prisma.lecture.findMany({
    where: {
      teacherId: req.params.id,
      isCancelled: false,
      timetable: { isActive: true, weekStart },
    },
    include: { subject: true, timetable: { include: { class: true } } },
  });

  const byDay = lectures.reduce(
    (acc, l) => {
      if (!acc[l.day]) acc[l.day] = [];
      acc[l.day].push(l);
      return acc;
    },
    {} as Record<string, typeof lectures>
  );

  return res.json({ totalLectures: lectures.length, byDay });
}

function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
