import { InlineKeyboard } from "grammy";
import type { Bot } from "grammy";
import type { MyContext } from "../bot.js";
import { config, getDoctor } from "../config.js";
import {
  getAppointmentsNeedingReminder,
  markReminderSent,
} from "../db/database.js";
import type { Appointment } from "../types.js";
import { formatDateTime } from "./notifications.js";

export function startReminderScheduler(bot: Bot<MyContext>): void {
  const check = () => void runReminderCheck(bot);

  check();
  setInterval(check, 15 * 60 * 1000);
  console.log(
    `⏰ Нагадування: перевірка кожні 15 хв (за ${config.reminderHoursBefore} год до візиту)`
  );
}

async function runReminderCheck(bot: Bot<MyContext>): Promise<void> {
  const appointments = getAppointmentsNeedingReminder(
    config.reminderHoursBefore
  );

  for (const appt of appointments) {
    await sendAppointmentReminder(bot, appt);
  }
}

export async function sendAppointmentReminder(
  bot: Bot<MyContext>,
  appt: Appointment,
  options?: { demo?: boolean; force?: boolean }
): Promise<boolean> {
  if (appt.reminder_sent && !options?.force) {
    return false;
  }

  if (!options?.demo && !["pending", "confirmed"].includes(appt.status)) {
    return false;
  }

  const doctor = getDoctor(appt.doctor_id);
  const keyboard = new InlineKeyboard()
    .text("✅ Підтверджую візит", `confirm:${appt.id}`)
    .text("❌ Скасувати", `cancel:${appt.id}`);

  const prefix = options?.demo ? "🧪 <b>[ДЕМО] Нагадування</b>\n\n" : "🔔 <b>Нагадування про візит</b>\n\n";
  const when = options?.demo
    ? "Тестове нагадування (для перевірки бота):\n"
    : "Завтра (або найближчим часом) у вас прийом:\n";

  let text =
    prefix +
    when +
    `👨‍⚕️ ${doctor?.name ?? appt.doctor_id}\n` +
    `📅 ${formatDateTime(appt.datetime)}\n\n` +
    `Будь ласка, підтвердіть або скасуйте запис.`;

  if (appt.meet_link) {
    text += `\n\n🔗 Онлайн: ${appt.meet_link}`;
  }

  try {
    await bot.api.sendMessage(appt.user_id, text, {
      parse_mode: "HTML",
      reply_markup: keyboard,
    });
    markReminderSent(appt.id);
    return true;
  } catch (err) {
    console.error(`Нагадування #${appt.id} не надіслано:`, err);
    return false;
  }
}
