// ─── Enums ────────────────────────────────────────────────────────────────────

export type Role = "SUPER_ADMIN" | "INSTITUTE_ADMIN" | "TEACHER" | "STUDENT";
export type Shift = "MORNING" | "AFTERNOON" | "EVENING";
export type Day =
  | "MONDAY" | "TUESDAY" | "WEDNESDAY"
  | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";
export type NotificationStatus = "SENT" | "FAILED" | "PENDING";

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  instituteId: string | null;
  teacher?: { id: string; employeeId: string | null };
  student?: { id: string; classId: string; rollNumber: string | null };
}

// ─── Institute ────────────────────────────────────────────────────────────────

export interface Institute {
  id: string;
  name: string;
  logoUrl: string | null;
  whatsappTemplate: string;
  timezone: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  color: string;
}

export interface ClassBatch {
  id: string;
  name: string;
  shift: Shift;
  lectureDuration: number;
  classSubjects: { subjectId: string; lecturesPerWeek: number; subject: Subject }[];
  _count: { students: number };
}

// ─── Teacher ──────────────────────────────────────────────────────────────────

export interface Teacher {
  id: string;
  employeeId: string | null;
  user: { name: string; email: string; phone: string | null };
  teacherSubjects: { subjectId: string; classId: string; subject: Subject }[];
  availability: { day: Day; startTime: string; endTime: string }[];
}

// ─── Student ──────────────────────────────────────────────────────────────────

export interface Student {
  id: string;
  rollNumber: string | null;
  parentWhatsapp: string | null;
  user: { name: string; email: string; phone: string | null };
  class: { name: string; shift: Shift };
}

// ─── Schedule ─────────────────────────────────────────────────────────────────

export interface Lecture {
  id: string;
  subjectId: string;
  teacherId: string;
  day: Day;
  startTime: string;
  endTime: string;
  isCancelled: boolean;
  substituteId: string | null;
  subject: Subject;
  teacher: { user: { name: string } };
}

export interface Timetable {
  id: string;
  classId: string;
  weekStart: string;
  lectures: Lecture[];
}

// ─── Attendance ───────────────────────────────────────────────────────────────

export interface AttendanceSummary {
  subjectId: string;
  name: string;
  color: string;
  total: number;
  present: number;
  percentage: number;
}

export interface NotificationLog {
  id: string;
  studentName: string;
  parentPhone: string;
  subject: string;
  date: string;
  status: NotificationStatus;
  errorMsg: string | null;
  sentAt: string | null;
  createdAt: string;
}

// ─── Material ─────────────────────────────────────────────────────────────────

export interface Material {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string;
  fileType: string;
  subjectId: string;
  subject: { name: string; color: string };
  createdAt: string;
}
