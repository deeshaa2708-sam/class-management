/**
 * WhatsApp notification service via Twilio.
 *
 * Uses the Twilio WhatsApp sandbox (or production approved number).
 * Each send is logged to NotificationLog for admin records.
 */

import twilio from "twilio";
import { env } from "../../config/env";
import { prisma } from "../../config/database";
import { interpolateTemplate } from "../../utils/helpers";

let client: ReturnType<typeof twilio> | null = null;

function getClient() {
  if (!client && env.twilio.accountSid && env.twilio.authToken) {
    client = twilio(env.twilio.accountSid, env.twilio.authToken);
  }
  return client;
}

export interface AbsenceNotificationPayload {
  instituteId: string;
  studentName: string;
  parentPhone: string; // E.164, e.g. +919876543210
  subjectName: string;
  date: Date;
  template: string; // from institute settings
}

export async function sendAbsenceNotification(
  payload: AbsenceNotificationPayload
): Promise<void> {
  const { instituteId, studentName, parentPhone, subjectName, date, template } = payload;

  const body = interpolateTemplate(template, {
    student_name: studentName,
    subject: subjectName,
    date: date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
  });

  const log = await prisma.notificationLog.create({
    data: {
      instituteId,
      studentName,
      parentPhone,
      subject: subjectName,
      date,
      status: "PENDING",
    },
  });

  const twilioClient = getClient();

  if (!twilioClient) {
    // Dev mode: just log the message
    console.log(
      `[WhatsApp MOCK] To ${parentPhone}: ${body}`
    );
    await prisma.notificationLog.update({
      where: { id: log.id },
      data: { status: "SENT", sentAt: new Date(), errorMsg: "Mock send (no Twilio creds)" },
    });
    return;
  }

  try {
    await twilioClient.messages.create({
      from: env.twilio.from,
      to: `whatsapp:${parentPhone}`,
      body,
    });
    await prisma.notificationLog.update({
      where: { id: log.id },
      data: { status: "SENT", sentAt: new Date() },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    await prisma.notificationLog.update({
      where: { id: log.id },
      data: { status: "FAILED", errorMsg: msg },
    });
    console.error(`[WhatsApp] Failed to send to ${parentPhone}: ${msg}`);
  }
}

/** Send notifications for all absent students in a batch */
export async function sendBulkAbsenceNotifications(
  payloads: AbsenceNotificationPayload[]
): Promise<{ sent: number; failed: number }> {
  const results = await Promise.allSettled(
    payloads.map((p) => sendAbsenceNotification(p))
  );
  const sent = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;
  return { sent, failed };
}
