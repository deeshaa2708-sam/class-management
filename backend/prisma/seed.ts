/**
 * Seed script — creates a demo institute with:
 *   1 admin, 3 teachers, 5 students, 3 subjects, 2 classes
 *
 * Run: npx ts-node prisma/seed.ts
 */

import { PrismaClient, Shift, Day, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database…");

  const hash = (p: string) => bcrypt.hash(p, 10);

  // ── Institute ──────────────────────────────────────────────────────────────
  const institute = await prisma.institute.upsert({
    where: { id: "inst-demo" },
    update: {},
    create: {
      id: "inst-demo",
      name: "Apex Coaching Institute",
      whatsappTemplate:
        "Dear Parent, your student {student_name} was absent for the {subject} class on {date}. Please contact the institute for more information.",
    },
  });
  console.log("  ✓ Institute:", institute.name);

  // ── Admin ──────────────────────────────────────────────────────────────────
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@apex.edu" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@apex.edu",
      passwordHash: await hash("admin1234"),
      role: Role.INSTITUTE_ADMIN,
      instituteId: institute.id,
    },
  });
  console.log("  ✓ Admin:", adminUser.email);

  // ── Subjects ───────────────────────────────────────────────────────────────
  const subjectData = [
    { name: "Mathematics",  code: "MATH101", color: "#6366f1" },
    { name: "Physics",      code: "PHY101",  color: "#10b981" },
    { name: "Chemistry",    code: "CHEM101", color: "#f59e0b" },
  ];
  const subjects = await Promise.all(
    subjectData.map((s) =>
      prisma.subject.upsert({
        where: { code_instituteId: { code: s.code, instituteId: institute.id } },
        update: {},
        create: { ...s, instituteId: institute.id },
      })
    )
  );
  console.log("  ✓ Subjects:", subjects.map((s) => s.name).join(", "));

  // ── Teachers ───────────────────────────────────────────────────────────────
  const teacherData = [
    { name: "Dr. Priya Sharma",  email: "priya@apex.edu",  subject: 0 },
    { name: "Prof. Arun Mehta",  email: "arun@apex.edu",   subject: 1 },
    { name: "Ms. Kavya Nair",    email: "kavya@apex.edu",  subject: 2 },
  ];

  const teachers = await Promise.all(
    teacherData.map(async (t) => {
      const user = await prisma.user.upsert({
        where: { email: t.email },
        update: {},
        create: {
          name: t.name,
          email: t.email,
          passwordHash: await hash("teacher123"),
          role: Role.TEACHER,
          instituteId: institute.id,
        },
      });
      const teacher = await prisma.teacher.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id, instituteId: institute.id },
      });

      // Availability: Mon–Fri 08:00–14:00
      await prisma.teacherAvailability.deleteMany({ where: { teacherId: teacher.id } });
      await prisma.teacherAvailability.createMany({
        data: [Day.MONDAY, Day.TUESDAY, Day.WEDNESDAY, Day.THURSDAY, Day.FRIDAY].map(
          (day) => ({ teacherId: teacher.id, day, startTime: "08:00", endTime: "14:00" })
        ),
      });

      return { teacher, subjectIndex: t.subject };
    })
  );
  console.log("  ✓ Teachers:", teacherData.map((t) => t.name).join(", "));

  // ── Classes ────────────────────────────────────────────────────────────────
  const classA = await prisma.class.upsert({
    where: { id: "class-11a" },
    update: {},
    create: {
      id: "class-11a",
      name: "Class 11 – A",
      shift: Shift.MORNING,
      lectureDuration: 50,
      instituteId: institute.id,
    },
  });

  // Assign subjects to classA
  for (let i = 0; i < subjects.length; i++) {
    const subject = subjects[i];
    const teacher = teachers[i].teacher;

    await prisma.classSubject.upsert({
      where: { classId_subjectId: { classId: classA.id, subjectId: subject.id } },
      update: {},
      create: { classId: classA.id, subjectId: subject.id, lecturesPerWeek: 4 },
    });

    await prisma.teacherSubject.upsert({
      where: {
        teacherId_subjectId_classId: {
          teacherId: teacher.id,
          subjectId: subject.id,
          classId: classA.id,
        },
      },
      update: {},
      create: { teacherId: teacher.id, subjectId: subject.id, classId: classA.id, lecturesRequired: 4 },
    });
  }
  console.log("  ✓ Class:", classA.name);

  // ── Students ───────────────────────────────────────────────────────────────
  const studentData = [
    { name: "Riya Sharma",   email: "riya@student.edu",   roll: "11A001", phone: "+919876543210" },
    { name: "Arjun Patel",   email: "arjun@student.edu",  roll: "11A002", phone: "+919876543211" },
    { name: "Sneha Kumar",   email: "sneha@student.edu",  roll: "11A003", phone: "+919876543212" },
    { name: "Vivek Rao",     email: "vivek@student.edu",  roll: "11A004", phone: "" },
    { name: "Aisha Khan",    email: "aisha@student.edu",  roll: "11A005", phone: "+919876543214" },
  ];

  for (const s of studentData) {
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: {
        name: s.name,
        email: s.email,
        passwordHash: await hash("student123"),
        role: Role.STUDENT,
        instituteId: institute.id,
      },
    });
    await prisma.student.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        classId: classA.id,
        rollNumber: s.roll,
        parentWhatsapp: s.phone || null,
        instituteId: institute.id,
      },
    });
  }
  console.log("  ✓ Students:", studentData.map((s) => s.name).join(", "));

  console.log("\n✅ Seed complete!");
  console.log("\n   Login credentials:");
  console.log("   Admin:   admin@apex.edu / admin1234");
  console.log("   Teacher: priya@apex.edu / teacher123");
  console.log("   Student: riya@student.edu / student123\n");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
