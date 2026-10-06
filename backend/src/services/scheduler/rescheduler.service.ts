/**
 * Rescheduler: handles teacher absence / extra-lecture requests.
 *
 * When a teacher marks absent for a day:
 *  1. Find all lectures assigned to them on that day for the affected timetable.
 *  2. For each lecture, try to find a substitute teacher who:
 *     - teaches the same subject
 *     - is available in that slot
 *     - is not already booked in that slot
 *  3. If a substitute is found, update the lecture with substituteId.
 *  4. If no substitute, mark the lecture as cancelled.
 *  5. Emit a socket event so affected students and teachers are notified.
 *
 * For extra-lecture requests:
 *  1. Find a free slot in the teacher's availability for the requested day.
 *  2. Add a new lecture to the day's timetable.
 */

import { Day, Prisma } from "@prisma/client";
import { prisma } from "../../config/database";
import { timesOverlap } from "../../utils/helpers";
import { getIO } from "../../socket";

export async function handleAbsence(
  teacherId: string,
  date: Date,
  instituteId: string
): Promise<void> {
  const day = getDayEnum(date);

  // Find the active timetable covering this week
  const weekStart = getWeekStart(date);
  const timetables = await prisma.timetable.findMany({
    where: { isActive: true, weekStart },
    include: {
      lectures: {
        where: { teacherId, day, isCancelled: false },
        include: { subject: true, timetable: { include: { class: true } } },
      },
    },
  });

  for (const tt of timetables) {
    for (const lecture of tt.lectures) {
      // Try to find a substitute
      const sub = await findSubstitute(
        lecture.subjectId,
        day,
        lecture.startTime,
        lecture.endTime,
        teacherId
      );

      if (sub) {
        await prisma.lecture.update({
          where: { id: lecture.id },
          data: { substituteId: sub },
        });
        emitTimetableUpdate(instituteId, lecture.timetable.class.id, "SUBSTITUTE_ASSIGNED", {
          lectureId: lecture.id,
          substituteId: sub,
        });
      } else {
        await prisma.lecture.update({
          where: { id: lecture.id },
          data: { isCancelled: true },
        });
        emitTimetableUpdate(instituteId, lecture.timetable.class.id, "LECTURE_CANCELLED", {
          lectureId: lecture.id,
        });
      }
    }
  }
}

async function findSubstitute(
  subjectId: string,
  day: Day,
  startTime: string,
  endTime: string,
  excludeTeacherId: string
): Promise<string | null> {
  // Teachers who can teach this subject
  const candidates = await prisma.teacherSubject.findMany({
    where: { subjectId, teacher: { id: { not: excludeTeacherId } } },
    include: {
      teacher: {
        include: {
          availability: { where: { day } },
        },
      },
    },
  });

  for (const ts of candidates) {
    const teacher = ts.teacher;
    const available = teacher.availability.some(
      (a) =>
        a.day === day &&
        timeToMinutes(a.startTime) <= timeToMinutes(startTime) &&
        timeToMinutes(a.endTime) >= timeToMinutes(endTime)
    );
    if (!available) continue;

    // Check if already booked in that slot this day
    const conflict = await prisma.lecture.findFirst({
      where: {
        teacherId: teacher.id,
        day,
        isCancelled: false,
        timetable: { isActive: true },
      },
    });

    if (!conflict || !timesOverlap(conflict.startTime, conflict.endTime, startTime, endTime)) {
      return teacher.id;
    }
  }

  return null;
}

function emitTimetableUpdate(
  instituteId: string,
  classId: string,
  event: string,
  data: object
) {
  try {
    const io = getIO();
    io.to(`institute:${instituteId}`).emit("timetable:update", {
      classId,
      event,
      ...data,
    });
  } catch {
    // socket not initialised yet during tests
  }
}

// ─── Helpers (duplicated to avoid circular deps) ─────────────────────────────

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

const DAY_MAP: Record<number, Day> = {
  0: Day.SUNDAY, 1: Day.MONDAY, 2: Day.TUESDAY, 3: Day.WEDNESDAY,
  4: Day.THURSDAY, 5: Day.FRIDAY, 6: Day.SATURDAY,
};
function getDayEnum(d: Date): Day { return DAY_MAP[d.getDay()]; }

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
