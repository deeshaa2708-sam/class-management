/**
 * Constraint-Satisfaction Problem solver for timetable generation.
 *
 * Given:
 *  - A class with a shift (start/end times), lecture duration, and a list of
 *    subject-teacher requirements with required lectures/week
 *  - Teacher availability windows per day
 *
 * Produces a weekly schedule: one Lecture assignment per slot with no
 * double-booked teachers and no overflow past shift hours.
 */

import { Day } from "@prisma/client";
import { timeToMinutes, minutesToTime, timesOverlap } from "../../utils/helpers";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TeacherSlot {
  day: Day;
  startTime: string; // "09:00"
  endTime: string;   // "13:00"
}

export interface SubjectRequirement {
  subjectId: string;
  teacherId: string;
  lecturesNeeded: number;
}

export interface ClassConfig {
  classId: string;
  shift: { startTime: string; endTime: string }; // shift boundaries
  lectureDuration: number; // minutes
  requirements: SubjectRequirement[];
}

export interface ScheduledLecture {
  subjectId: string;
  teacherId: string;
  day: Day;
  startTime: string;
  endTime: string;
}

// ─── Helper: build possible slots for a given day ────────────────────────────

function buildDaySlots(
  shiftStart: string,
  shiftEnd: string,
  duration: number
): { startTime: string; endTime: string }[] {
  const slots: { startTime: string; endTime: string }[] = [];
  let cur = timeToMinutes(shiftStart);
  const end = timeToMinutes(shiftEnd);
  while (cur + duration <= end) {
    slots.push({ startTime: minutesToTime(cur), endTime: minutesToTime(cur + duration) });
    cur += duration;
  }
  return slots;
}

// ─── Main CSP solver ─────────────────────────────────────────────────────────

export function generateTimetable(
  config: ClassConfig,
  teacherAvailability: Record<string, TeacherSlot[]> // teacherId -> slots
): ScheduledLecture[] | null {
  const result: ScheduledLecture[] = [];

  // Track booked slots per teacher across all classes this week
  // (caller can pass in pre-booked slots from other class runs)
  const teacherBookings: Record<string, { day: Day; startTime: string; endTime: string }[]> = {};

  // Flatten requirements into a list of lectures to assign
  const pending: { subjectId: string; teacherId: string }[] = [];
  for (const req of config.requirements) {
    for (let i = 0; i < req.lecturesNeeded; i++) {
      pending.push({ subjectId: req.subjectId, teacherId: req.teacherId });
    }
  }

  // Shuffle pending for fairer distribution across days
  pending.sort(() => Math.random() - 0.5);

  // All scheduling days
  const DAYS: Day[] = [
    Day.MONDAY, Day.TUESDAY, Day.WEDNESDAY,
    Day.THURSDAY, Day.FRIDAY, Day.SATURDAY,
  ];

  function isTeacherAvailable(
    teacherId: string,
    day: Day,
    slotStart: string,
    slotEnd: string
  ): boolean {
    const avail = teacherAvailability[teacherId] ?? [];
    const fits = avail.some(
      (a) =>
        a.day === day &&
        timeToMinutes(a.startTime) <= timeToMinutes(slotStart) &&
        timeToMinutes(a.endTime) >= timeToMinutes(slotEnd)
    );
    if (!fits) return false;

    // Check for double-booking
    const booked = teacherBookings[teacherId] ?? [];
    return !booked.some(
      (b) =>
        b.day === day &&
        timesOverlap(b.startTime, b.endTime, slotStart, slotEnd)
    );
  }

  function isSlotFreeInClass(
    day: Day,
    slotStart: string,
    slotEnd: string
  ): boolean {
    return !result.some(
      (l) =>
        l.day === day &&
        timesOverlap(l.startTime, l.endTime, slotStart, slotEnd)
    );
  }

  function backtrack(index: number): boolean {
    if (index === pending.length) return true;

    const { subjectId, teacherId } = pending[index];

    for (const day of DAYS) {
      const daySlots = buildDaySlots(
        config.shift.startTime,
        config.shift.endTime,
        config.lectureDuration
      );

      for (const slot of daySlots) {
        if (
          isTeacherAvailable(teacherId, day, slot.startTime, slot.endTime) &&
          isSlotFreeInClass(day, slot.startTime, slot.endTime)
        ) {
          // Assign
          result.push({ subjectId, teacherId, day, ...slot });
          teacherBookings[teacherId] = [
            ...(teacherBookings[teacherId] ?? []),
            { day, startTime: slot.startTime, endTime: slot.endTime },
          ];

          if (backtrack(index + 1)) return true;

          // Un-assign
          result.pop();
          teacherBookings[teacherId] = (teacherBookings[teacherId] ?? []).filter(
            (b) =>
              !(b.day === day && b.startTime === slot.startTime && b.endTime === slot.endTime)
          );
        }
      }
    }

    return false; // no valid assignment found
  }

  return backtrack(0) ? result : null;
}

// ─── Shift boundaries per Shift enum value ───────────────────────────────────

export const SHIFT_BOUNDARIES: Record<string, { startTime: string; endTime: string }> = {
  MORNING:   { startTime: "07:00", endTime: "12:00" },
  AFTERNOON: { startTime: "12:00", endTime: "17:00" },
  EVENING:   { startTime: "17:00", endTime: "21:00" },
};
