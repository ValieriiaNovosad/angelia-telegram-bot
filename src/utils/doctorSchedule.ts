import type { Doctor } from "../types.js";
import { buildDateTimeKyiv } from "./kyivTime.js";
import { calendarDateKey, isPastDateTime } from "./visitDate.js";

const DEFAULT_SLOT_MINUTES = 30;
const SLOTS_PER_PAGE = 12;

export function validateDoctorDate(doctor: Doctor, date: Date): string | null {
  const windows = getWindowsForDate(doctor, date);
  if (windows.length === 0) {
    return (
      `❌ ${doctor.name} не приймає в цей день.\n\n` +
      `🕐 Графік лікаря:\n${doctor.schedule}\n\n` +
      `Введіть іншу дату:`
    );
  }
  return null;
}

export function getAvailableSlots(
  doctor: Doctor,
  date: Date,
  bookedTimes: string[] = []
): string[] {
  const windows = getWindowsForDate(doctor, date);
  const slotMinutes = doctor.slotMinutes ?? DEFAULT_SLOT_MINUTES;
  const bookedSet = new Set(bookedTimes);
  const slots: string[] = [];

  for (const window of windows) {
    let cursor = parseTime(window.from);
    const end = parseTime(window.to);

    while (cursor + slotMinutes <= end) {
      const label = formatTime(cursor);
      const datetime = buildDateTimeKyiv(date, label);

      if (!bookedSet.has(label) && !isPastDateTime(datetime)) {
        slots.push(label);
      }
      cursor += slotMinutes;
    }
  }

  return slots;
}

export function dateKeyFromDate(date: Date): string {
  return calendarDateKey(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate()
  );
}

export function slotsPerPage(): number {
  return SLOTS_PER_PAGE;
}

function getWindowsForDate(
  doctor: Doctor,
  date: Date
): { from: string; to: string }[] {
  const weekday = date.getDay();
  return (doctor.availability ?? []).filter((w) => w.days.includes(weekday));
}

function parseTime(value: string): number {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
