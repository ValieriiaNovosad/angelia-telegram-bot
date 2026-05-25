const KYIV_TZ = "Europe/Kyiv";

/** Пн–Чт 09:00–20:00, Пт 09:00–16:00, Сб–Нд — вихідний */
export function isReceptionOpen(now = new Date()): boolean {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: KYIV_TZ,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "";
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  const minutes = hour * 60 + minute;

  if (weekday === "Sat" || weekday === "Sun") return false;

  if (weekday === "Fri") {
    return minutes >= 9 * 60 && minutes < 16 * 60;
  }

  // Mon–Thu
  return minutes >= 9 * 60 && minutes < 20 * 60;
}
