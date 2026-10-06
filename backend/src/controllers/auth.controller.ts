import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../config/database";
import { signToken } from "../utils/jwt";

const RegisterSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["INSTITUTE_ADMIN", "TEACHER", "STUDENT"]),
  instituteId: z.string().optional(),
  phone: z.string().optional(),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function register(req: Request, res: Response) {
  const data = RegisterSchema.parse(req.body);
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) return res.status(409).json({ message: "Email already in use" });

  const passwordHash = await bcrypt.hash(data.password, 12);
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role,
      phone: data.phone,
      instituteId: data.instituteId,
    },
    select: { id: true, name: true, email: true, role: true, instituteId: true },
  });

  const token = signToken({
    userId: user.id,
    role: user.role,
    instituteId: user.instituteId,
  });

  return res.status(201).json({ user, token });
}

export async function login(req: Request, res: Response) {
  const data = LoginSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const valid = await bcrypt.compare(data.password, user.passwordHash);
  if (!valid) return res.status(401).json({ message: "Invalid credentials" });

  const token = signToken({
    userId: user.id,
    role: user.role,
    instituteId: user.instituteId,
  });

  return res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      instituteId: user.instituteId,
    },
  });
}

export async function me(req: Request, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: {
      id: true, name: true, email: true, role: true, instituteId: true, phone: true,
      teacher: { select: { id: true, employeeId: true } },
      student: { select: { id: true, classId: true, rollNumber: true } },
    },
  });
  if (!user) return res.status(404).json({ message: "User not found" });
  return res.json(user);
}
