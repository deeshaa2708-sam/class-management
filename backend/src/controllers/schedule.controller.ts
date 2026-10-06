import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/database";
import { getWeekStart } from "../utils/helpers";
import {
  generateTimetable,
  SHIFT_BOUNDARIES,
  ClassConfig,
  TeacherSlot,
} from "../services/scheduler/csp.service";
import { handleAbsence } from "../services/scheduler/rescheduler.service";
import { Day } from "@prisma/client";
import { getIO } from "../socket";

/** POST /api/schedules/generate/:classId */
export async function generateSchedule(req: Request, res: Response) {
  const { classId } = req.params;
  const weekStart = getWeekStart();

  const cls = await prisma.class.findUniqueOrThrow({
    where: { id: classId },
    include: {
      classSubjects: {
        include: {
          subject: {
            include: {
              teacherSubjects: { include: { teacher: { include: { availability: true } } } },
            },
          },
        },
      },
    },
  });

  // Build config
  const shiftBounds = SHIFT_BOUNDARIES[cls.shift];
  const requirements: ClassConfig["requirements"] = [];
  const teacherAvailability: Record<string, TeacherSlot[]> = {};

  for (const cs of cls.classSubjects) {
    const ts = cs.subject.teacherSubjects.find((t) => t.classId === classId);
    if (!ts) continue;
    requirements.push({
      subjectId: cs.subjectId,
      teacherId: ts.teacherId,
      lecturesNeeded: cs.lecturesPerWeek,
    });
    if (!teacherAvailability[ts.teacherId]) {
      teacherAvailability[ts.teacherId] = ts.teacher.availability.map((a) => ({
        day: a.day as Day,
        startTime: a.startTime,
        endTime: a.endTime,
      }));
    }
  }

  const config: ClassConfig = {
    classId,
    shift: shiftBounds,
    lectureDuration: cls.lectureDuration,
    requirements,
  };

  const scheduled = generateTimetable(config, teacherAvailability);
  if (!scheduled) {
    return res.status(422).json({
      message: "Could not generate a conflict-free timetable. Check teacher availability and lecture counts.",
    });
  }

  // Deactivate old timetable for this class/week
  await prisma.timetable.updateMany({
    where: { classId, weekStart },
    data: { isActive: false },
  });

  const timetable = await prisma.timetable.create({
    data: {
      classId,
      weekStart,
      lectures: {
        create: scheduled.map((l) => ({
          subjectId: l.subjectId,
          teacherId: l.teacherId,
          day: l.day,
          startTime: l.startTime,
          endTime: l.endTime,
        })),
      },
    },
    include: { lectures: { include: { subject: true, teacher: { include: { user: true } } } } },
  });

  // Notify everyone in the institute
  try {
    getIO()
      .to(`institute:${req.user!.instituteId}`)
      .emit("timetable:generated", { classId, timetableId: timetable.id });
  } catch { /* socket may not be up in tests */ }

  return res.status(201).json(timetable);
}

/** GET /api/schedules/:classId?week=YYYY-MM-DD */
export async function getTimetable(req: Request, res: Response) {
  const { classId } = req.params;
  const weekParam = req.query.week as string | undefined;
  const weekStart = weekParam ? new Date(weekParam) : getWeekStart();

  const timetable = await prisma.timetable.findFirst({
    where: { classId, weekStart, isActive: true },
    include: {
      lectures: {
        orderBy: [{ day: "asc" }, { startTime: "asc" }],
        include: { subject: true, teacher: { include: { user: true } } },
      },
    },
  });

  if (!timetable) return res.status(404).json({ message: "No timetable for this week" });
  return res.json(timetable);
}

/** PATCH /api/schedules/lectures/:lectureId — manual drag-drop override */
const MoveLectureSchema = z.object({
  day: z.nativeEnum(Day),
  startTime: z.string(),
  endTime: z.string(),
  teacherId: z.string().optional(),
});

export async function moveLecture(req: Request, res: Response) {
  const { lectureId } = req.params;
  const data = MoveLectureSchema.parse(req.body);

  // Conflict check: any other lecture for same teacher on same day/slot?
  const lecture = await prisma.lecture.findUniqueOrThrow({ where: { id: lectureId } });
  const teacherId = data.teacherId ?? lecture.teacherId;

  const conflict = await prisma.lecture.findFirst({
    where: {
      id: { not: lectureId },
      teacherId,
      day: data.day,
      isCancelled: false,
      timetable: { isActive: true },
    },
  });

  if (conflict) {
    // Return 409 with conflict info so UI can show a warning
    return res.status(409).json({
      message: "Teacher conflict detected",
      conflict: { lectureId: conflict.id, startTime: conflict.startTime, endTime: conflict.endTime },
    });
  }

  const updated = await prisma.lecture.update({
    where: { id: lectureId },
    data: { day: data.day, startTime: data.startTime, endTime: data.endTime, teacherId },
    include: { subject: true, teacher: { include: { user: true } } },
  });

  return res.json(updated);
}

/** POST /api/schedules/absence */
const AbsenceSchema = z.object({
  teacherId: z.string(),
  date: z.string(), // ISO date
  reason: z.string().optional(),
});

export async function reportAbsence(req: Request, res: Response) {
  const data = AbsenceSchema.parse(req.body);
  const date = new Date(data.date);

  await prisma.changeRequest.create({
    data: {
      teacherId: data.teacherId,
      type: "ABSENCE",
      date,
      reason: data.reason,
      status: "AUTO_RESOLVED",
    },
  });

  await handleAbsence(data.teacherId, date, req.user!.instituteId!);
  return res.json({ message: "Absence processed and timetable updated" });
}
