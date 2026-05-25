import { InlineKeyboard } from "grammy";

export function encodeSlotCallback(dateKey: string, time: string): string {
  return `book:slot:${dateKey}|${time}`;
}

export function decodeSlotCallback(data: string): { dateKey: string; time: string } | null {
  const m = data.match(/^book:slot:(\d{4}-\d{2}-\d{2})\|(\d{2}:\d{2})$/);
  if (!m) return null;
  return { dateKey: m[1], time: m[2] };
}

export function encodeSlotsPageCallback(dateKey: string, page: number): string {
  return `book:slots:${dateKey}|${page}`;
}

export function decodeSlotsPageCallback(
  data: string
): { dateKey: string; page: number } | null {
  const m = data.match(/^book:slots:(\d{4}-\d{2}-\d{2})\|(\d+)$/);
  if (!m) return null;
  return { dateKey: m[1], page: Number(m[2]) };
}

export function buildTimeSlotsKeyboard(
  slots: string[],
  dateKey: string,
  page: number,
  perPage: number
): InlineKeyboard {
  const kb = new InlineKeyboard();
  const start = page * perPage;
  const pageSlots = slots.slice(start, start + perPage);

  for (let i = 0; i < pageSlots.length; i += 3) {
    const row = pageSlots.slice(i, i + 3);
    for (const time of row) {
      kb.text(time, encodeSlotCallback(dateKey, time));
    }
    kb.row();
  }

  const hasPrev = page > 0;
  const hasNext = start + perPage < slots.length;
  if (hasPrev || hasNext) {
    if (hasPrev) {
      kb.text("◀️ Назад", encodeSlotsPageCallback(dateKey, page - 1));
    }
    if (hasNext) {
      kb.text("Далі ▶️", encodeSlotsPageCallback(dateKey, page + 1));
    }
    kb.row();
  }

  kb.text("📅 Інша дата", "book:change_date");
  return kb;
}
