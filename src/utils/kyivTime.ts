const KYIV_TZ = "Europe/Kyiv";

/** ГГ:ХХ у київському часовому поясі */
export function formatTimeKyiv(instant: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: KYIV_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(instant);

  const hour = parts.find((p) => p.type === "hour")?.value ?? "00";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
}

/** Локальний час у Києві → UTC Date для збереження в БД */
export function buildDateTimeKyiv(visitDate: Date, time: string): Date {
  const [targetH, targetM] = time.split(":").map(Number);
  let ts = Date.UTC(
    visitDate.getFullYear(),
    visitDate.getMonth(),
    visitDate.getDate(),
    targetH,
    targetM
  );

  for (let i = 0; i < 4; i++) {
    const { h, m } = getKyivHourMinute(new Date(ts));
    const diffMinutes = targetH * 60 + targetM - (h * 60 + m);
    if (diffMinutes === 0) break;
    ts -= diffMinutes * 60 * 1000;
  }

  return new Date(ts);
}

export function startOfKyivDay(visitDate: Date): Date {
  return buildDateTimeKyiv(visitDate, "00:00");
}

export function startOfNextKyivDay(visitDate: Date): Date {
  const next = new Date(visitDate);
  next.setDate(next.getDate() + 1);
  return buildDateTimeKyiv(next, "00:00");
}

function getKyivHourMinute(d: Date): { h: number; m: number } {
  const formatted = new Intl.DateTimeFormat("en-GB", {
    timeZone: KYIV_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
  const [h, m] = formatted.split(":").map(Number);
  return { h, m };
}
