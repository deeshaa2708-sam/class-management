import { Request, Response } from "express";
import { z } from "zod";
import fs from "fs";
import { prisma } from "../config/database";
import { parseAttendanceSheet } from "../services/attendance/parser.service";
import { sendBulkAbsenceNotifications } from "../services/notifications/whatsapp.service";

/** POST /api/attendance/upload
 *  Multipart: file (Excel), classId, lectureId (or subjectId + date)
 */
export async function uploadAttendance(req: Request, res: Response) {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  const { classId, lectureId, subjectId, date } = req.body as {
    classId: string;
    lectureId?: string;
    subjectId?: string;
    date?: string;
  };

  if (!classId) return res.status(400).json({ message: "classId required" });
  if (!lectureId && (!subjectId || !date)) {
    return res.status(400).json({ message: "lectureId or (subjectId + date) required" });
  }

  // Parse the Excel file
  let rows;
  try {
    rows = parseAttendanceSheet(req.file.path);
  } finally {
    fs.unlink(req.file.path, () => {}); // cleanup tmp file
  }

  // Resolve lecture
  let resolvedLectureId = lectureId;
  let resolvedSubjectId = subjectId;
  if (!resolvedLectureId && subjectId && date) {
    const lec = await prisma.lecture.findFirst({
      where: {
        subjectId,
        day: getDayEnum(new Date(date)),
        timetable: { classId, isActive: true },
      },
    });
    if (!lec) return res.status(404).json({ message: "Lecture not found for given subject/date" });
    resolvedLectureId = lec.id;
    resolvedSubjectId = lec.subjectId;
  }

  // Fetch students in this class
  const students = await prisma.student.findMany({
    where: { classId },
    include: { user: { select: { name: true } } },
  });

  const rollMap = new Map(students.map((s) => [s.rollNumber?.toLowerCase(), s]));
  const nameMap = new Map(students.map((s) => [s.user.name.toLowerCase(), s]));

  const records: { studentId: string; present: boolean; lectureId: string; subjectId: string; date: Date }[] = [];
  const absentees: { studentName: string; parentPhone: string; present: boolean }[] = [];

  for (const row of rows) {
    const student =
      rollMap.get(row.rollNumber.toLowerCase()) ??
      nameMap.get(row.studentName.toLowerCase());
    if (!student) continue;

    records.push({
      studentId: student.id,
      present: row.present,
      lectureId: resolvedLectureId!,
      subjectId: resolvedSubjectId!,
      date: date ? new Date(date) : new Date(),
    });

    if (!row.present && student.parentWhatsapp) {
      absentees.push({
        studentName: row.studentName || student.user.name,
        parentPhone: student.parentWhatsapp,
        present: false,
      });
    }
  }

  // Upsert attendance records
  await prisma.$transaction(
    records.map((r) =>
      prisma.attendanceRecord.upsert({
        where: { studentId_lectureId: { studentId: r.studentId, lectureId: r.lectureId } },
        create: r,
        update: { present: r.present },
      })
    )
  );

  // Send WhatsApp notifications to absent students' parents
  const institute = await prisma.institute.findUniqueOrThrow({
    where: { id: req.user!.instituteId! },
    select: { whatsappTemplate: true },
  });

  const subject = await prisma.subject.findUniqueOrThrow({
    where: { id: resolvedSubjectId! },
    select: { name: true },
  });

  const notifPayloads = absentees.map((a) => ({
    instituteId: req.user!.instituteId!,
    studentName: a.studentName,
    parentPhone: a.parentPhone,
    subjectName: subject.name,
    date: date ? new Date(date) : new Date(),
    template: institute.whatsappTemplate,
  }));

  const { sent, failed } = await sendBulkAbsenceNotifications(notifPayloads);

  return res.json({
    message: "Attendance processed",
    recorded: records.length,
    absentees: absentees.length,
    notifications: { sent, failed },
  });
}

/** GET /api/attendance/:studentId — per-subject summary */
export async function getStudentAttendance(req: Request, res: Response) {
  const { studentId } = req.params;

  const records = await prisma.attendanceRecord.findMany({
    where: { studentId },
    include: { subject: { select: { name: true, color: true } } },
  });

  // Group by subject
  const grouped: Record<string, { name: string; color: string; total: number; present: number }> = {};
  for (const r of records) {
    if (!grouped[r.subjectId]) {
      grouped[r.subjectId] = { name: r.subject.name, color: r.subject.color, total: 0, present: 0 };
    }
    grouped[r.subjectId].total++;
    if (r.present) grouped[r.subjectId].present++;
  }

  const summary = Object.entries(grouped).map(([subjectId, data]) => ({
    subjectId,
    ...data,
    percentage: data.total > 0 ? Math.round((data.present / data.total) * 100) : 0,
  }));

  return res.json(summary);
}

/** GET /api/attendance/logs — notification delivery log for admin */
export async function getNotificationLogs(req: Request, res: Response) {
  const { page = "1", limit = "20", status } = req.query as Record<string, string>;
  const skip = (Number(page) - 1) * Number(limit);

  const where = {
    instituteId: req.user!.instituteId!,
    ...(status ? { status: status as "SENT" | "FAILED" | "PENDING" } : {}),
  };

  const [logs, total] = await Promise.all([
    prisma.notificationLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: Number(limit),
    }),
    prisma.notificationLog.count({ where }),
  ]);

  return res.json({ logs, total, page: Number(page), limit: Number(limit) });
}

// ─── Helper ────────────────────────────────────────────────────────────────────
import { Day } from "@prisma/client";
const DAY_MAP: Record<number, Day> = {
  0: Day.SUNDAY, 1: Day.MONDAY, 2: Day.TUESDAY, 3: Day.WEDNESDAY,
  4: Day.THURSDAY, 5: Day.FRIDAY, 6: Day.SATURDAY,
};
function getDayEnum(d: Date): Day { return DAY_MAP[d.getDay()]; }
