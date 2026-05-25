import Database from "better-sqlite3";
import { config } from "../config.js";
import type { Appointment, AppointmentStatus } from "../types.js";
import {
  formatTimeKyiv,
  startOfKyivDay,
  startOfNextKyivDay,
} from "../utils/kyivTime.js";

const db = new Database(config.dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    username TEXT,
    patient_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    doctor_id TEXT NOT NULL,
    datetime TEXT NOT NULL,
    is_online INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending',
    meet_link TEXT,
    reminder_sent INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

export interface CreateAppointmentInput {
  userId: number;
  username?: string;
  patientName: string;
  phone: string;
  doctorId: string;
  datetime: string;
  isOnline: boolean;
  meetLink?: string;
}

export function createAppointment(input: CreateAppointmentInput): Appointment {
  const stmt = db.prepare(`
    INSERT INTO appointments (user_id, username, patient_name, phone, doctor_id, datetime, is_online, meet_link)
    VALUES (@userId, @username, @patientName, @phone, @doctorId, @datetime, @isOnline, @meetLink)
  `);
  const result = stmt.run({
    userId: input.userId,
    username: input.username ?? null,
    patientName: input.patientName,
    phone: input.phone,
    doctorId: input.doctorId,
    datetime: input.datetime,
    isOnline: input.isOnline ? 1 : 0,
    meetLink: input.meetLink ?? null,
  });
  return getAppointmentById(Number(result.lastInsertRowid))!;
}

export function getAppointmentById(id: number): Appointment | undefined {
  return db.prepare("SELECT * FROM appointments WHERE id = ?").get(id) as
    | Appointment
    | undefined;
}

export function updateAppointmentStatus(
  id: number,
  status: AppointmentStatus
): void {
  db.prepare("UPDATE appointments SET status = ? WHERE id = ?").run(status, id);
}

export function setMeetLink(id: number, meetLink: string): void {
  db.prepare("UPDATE appointments SET meet_link = ? WHERE id = ?").run(
    meetLink,
    id
  );
}

export function markReminderSent(id: number): void {
  db.prepare("UPDATE appointments SET reminder_sent = 1 WHERE id = ?").run(id);
}

export function getAppointmentsNeedingReminder(
  hoursBefore: number
): Appointment[] {
  const stmt = db.prepare(`
    SELECT * FROM appointments
    WHERE status IN ('pending', 'confirmed')
      AND reminder_sent = 0
      AND datetime(datetime) BETWEEN datetime('now', '+' || @hours || ' hours', '-30 minutes')
                                AND datetime('now', '+' || @hours || ' hours', '+30 minutes')
  `);
  return stmt.all({ hours: hoursBefore }) as Appointment[];
}

export function getUserAppointments(userId: number): Appointment[] {
  return db
    .prepare(
      `SELECT * FROM appointments WHERE user_id = ? ORDER BY datetime DESC LIMIT 10`
    )
    .all(userId) as Appointment[];
}

/** Часи слотів (ГГ:ХХ), уже зайняті у лікаря на календарний день (Київ) */
export function getBookedSlotTimes(
  doctorId: string,
  dateKey: string
): string[] {
  const [y, mo, d] = dateKey.split("-").map(Number);
  const visitDate = new Date(y, mo - 1, d);
  const from = startOfKyivDay(visitDate).toISOString();
  const to = startOfNextKyivDay(visitDate).toISOString();

  const rows = db
    .prepare(
      `
    SELECT datetime FROM appointments
    WHERE doctor_id = ?
      AND status IN ('pending', 'confirmed')
      AND datetime >= ?
      AND datetime < ?
  `
    )
    .all(doctorId, from, to) as { datetime: string }[];

  return rows.map((r) => formatTimeKyiv(new Date(r.datetime)));
}

export function getPendingAppointments(limit = 20): Appointment[] {
  return db
    .prepare(
      `SELECT * FROM appointments WHERE status = 'pending' ORDER BY datetime ASC LIMIT ?`
    )
    .all(limit) as Appointment[];
}

export function resetReminderSent(id: number): void {
  db.prepare("UPDATE appointments SET reminder_sent = 0 WHERE id = ?").run(id);
}
