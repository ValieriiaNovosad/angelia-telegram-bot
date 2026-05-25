const KYIV_TZ = "Europe/Kyiv";

/** Ключ YYYY-MM-DD для порівняння календарних дат */
export function calendarDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function todayKeyKyiv(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: KYIV_TZ });
}

export function parseUaDate(input: string): Date | null {
  const m = input.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  const d = new Date(year, month - 1, day);
  if (d.getDate() !== day || d.getMonth() !== month - 1) return null;
  return d;
}

/** Повертає текст помилки або null, якщо дата підходить */
export function validateVisitDate(date: Date): string | null {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const dayOfMonth = date.getDate();
  const weekday = date.getDay();
  if (weekday === 0 || weekday === 6) {
    return "❌ Субота та неділя — вихідні. Оберіть день Пн–Пт.";
  }

  const visitKey = calendarDateKey(year, month, dayOfMonth);
  if (visitKey < todayKeyKyiv()) {
    return "❌ Дата в минулому. Введіть сьогоднішню або майбутню дату.";
  }

  return null;
}

export function isPastDateTime(datetime: Date): boolean {
  return datetime.getTime() < Date.now();
}
