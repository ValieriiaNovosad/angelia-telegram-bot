import { InlineKeyboard, type Api, RawApi } from "grammy";
import { config, getDoctor } from "../config.js";
import type { Appointment } from "../types.js";

type BotApi = Api<RawApi>;

export async function notifyAdmins(
  api: BotApi,
  text: string,
  replyMarkup?: InlineKeyboard
): Promise<void> {
  for (const chatId of config.adminChatIds) {
    try {
      await api.sendMessage(chatId, text, {
        parse_mode: "HTML",
        reply_markup: replyMarkup,
      });
    } catch (err) {
      console.error(`Не вдалося надіслати адміну ${chatId}:`, err);
    }
  }
}

export function adminAppointmentKeyboard(apptId: number): InlineKeyboard {
  return new InlineKeyboard()
    .text("✅ Підтвердити", `admin:confirm:${apptId}`)
    .text("❌ Скасувати", `admin:cancel:${apptId}`);
}

export async function notifyAdminsNewAppointment(
  api: BotApi,
  appt: Appointment
): Promise<void> {
  await notifyAdmins(
    api,
    formatAppointmentForAdmin(appt),
    adminAppointmentKeyboard(appt.id)
  );
}

export function formatAppointmentForAdmin(appt: Appointment): string {
  const doctor = getDoctor(appt.doctor_id);
  const online = appt.is_online ? "🌐 Онлайн" : "🏥 Офлайн";
  const meet = appt.meet_link ? `\n🔗 Meet: ${appt.meet_link}` : "";
  return (
    `📋 <b>Нова заявка #${appt.id}</b>\n` +
    `👤 ${appt.patient_name}\n` +
    `📞 ${appt.phone}\n` +
    `👨‍⚕️ ${doctor?.name ?? appt.doctor_id}\n` +
    `📅 ${formatDateTime(appt.datetime)}\n` +
    `${online}${meet}\n` +
    `🆔 Telegram: ${appt.user_id}${appt.username ? ` (@${appt.username})` : ""}`
  );
}

export function formatAppointmentForUser(appt: Appointment): string {
  const doctor = getDoctor(appt.doctor_id);
  const statusLabel =
    appt.status === "confirmed"
      ? "✅ Підтверджено"
      : appt.status === "cancelled"
        ? "❌ Скасовано"
        : "⏳ Очікує підтвердження";
  let text =
    `Запис #${appt.id}\n` +
    `Лікар: ${doctor?.name ?? appt.doctor_id}\n` +
    `Дата: ${formatDateTime(appt.datetime)}\n` +
    `Статус: ${statusLabel}`;
  if (appt.meet_link) {
    text += `\n\n🔗 Онлайн-зустріч: ${appt.meet_link}`;
  }
  return text;
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("uk-UA", {
    timeZone: "Europe/Kyiv",
    dateStyle: "medium",
    timeStyle: "short",
  });
}
