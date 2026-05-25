import "dotenv/config";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type {
  ClinicDirection,
  ClinicInfo,
  Doctor,
  HandbookSection,
  ServiceCategory,
} from "./types.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadJson<T>(relativePath: string): T {
  const path = join(root, relativePath);
  return JSON.parse(readFileSync(path, "utf-8")) as T;
}

export const config = {
  botToken: requireEnv("BOT_TOKEN"),
  adminChatIds: (process.env.ADMIN_CHAT_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .map(Number)
    .filter((n) => !Number.isNaN(n)),
  reminderHoursBefore: Number(process.env.REMINDER_HOURS_BEFORE ?? "24"),
  google: {
    enabled: process.env.GOOGLE_CALENDAR_ENABLED === "true",
    calendarId: process.env.GOOGLE_CALENDAR_ID ?? "primary",
    credentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  },
  clinic: loadJson<ClinicInfo>("data/clinic.json"),
  doctors: loadJson<Doctor[]>("data/doctors.json"),
  services: loadJson<ServiceCategory[]>("data/services.json"),
  directions: loadJson<ClinicDirection[]>("data/directions.json"),
  handbook: loadJson<HandbookSection[]>("data/handbook.json"),
  dbPath: join(root, "data", "appointments.db"),
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Змінна середовища ${name} не задана. Скопіюйте .env.example → .env`);
  }
  return value;
}

export function getDoctor(id: string): Doctor | undefined {
  return config.doctors.find((d) => d.id === id);
}

export function getDirection(id: string): ClinicDirection | undefined {
  return config.directions.find((d) => d.id === id);
}
