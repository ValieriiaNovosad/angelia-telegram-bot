import type { Conversation } from "@grammyjs/conversations";
import { InlineKeyboard } from "grammy";
import type { MyContext } from "../bot.js";
import { config, getDoctor } from "../config.js";
import type { Doctor } from "../types.js";
import { createAppointment, getBookedSlotTimes, setMeetLink } from "../db/database.js";
import {
  buildTimeSlotsKeyboard,
  decodeSlotCallback,
  decodeSlotsPageCallback,
} from "../keyboards/timeSlots.js";
import { createMeetEvent } from "../services/googleMeet.js";
import {
  formatAppointmentForUser,
  notifyAdminsNewAppointment,
} from "../services/notifications.js";
import {
  dateKeyFromDate,
  getAvailableSlots,
  slotsPerPage,
  validateDoctorDate,
} from "../utils/doctorSchedule.js";
import { buildDateTimeKyiv } from "../utils/kyivTime.js";
import { parseUaDate, validateVisitDate } from "../utils/visitDate.js";

type BookingConversation = Conversation<MyContext, MyContext>;

export async function bookingConversation(
  conversation: BookingConversation,
  ctx: MyContext,
  preselectedDoctorId?: string
): Promise<void> {
  let doctor: Doctor | undefined = preselectedDoctorId
    ? getDoctor(preselectedDoctorId)
    : undefined;

  if (!doctor) {
    await ctx.reply("📅 <b>Запис на прийом</b>\n\nОберіть лікаря:", {
      parse_mode: "HTML",
      reply_markup: doctorsKeyboard(),
    });

    const doctorCtx = await conversation.waitFor("callback_query:data");
    const doctorData = doctorCtx.callbackQuery?.data ?? "";
    await doctorCtx.answerCallbackQuery();

    if (doctorData === "book:cancel") {
      await doctorCtx.reply("Запис скасовано.");
      return;
    }

    doctor = getDoctor(doctorData.replace("book:doctor:", ""));
    if (!doctor) {
      await doctorCtx.reply("Лікар не знайдений. Спробуйте знову /start");
      return;
    }
    ctx = doctorCtx;
  }

  let visitDate: Date | undefined;
  let dateCtx: MyContext | null = null;

  while (!visitDate) {
    await (dateCtx ?? ctx).reply(
      `Обрано: <b>${doctor.name}</b>\n\n` +
        `🕐 <i>${doctor.schedule}</i>\n\n` +
        `Введіть дату візиту (ДД.ММ.РРРР), наприклад 25.05.2026:\n` +
        `<i>Клініка: Пн–Чт 9–20, Пт 9–16, Сб–Нд вихідний. Дата — за графіком лікаря.</i>`,
      { parse_mode: "HTML" }
    );

    const inputCtx = await conversation.waitFor([
      "message:text",
      "callback_query:data",
    ]);

    if (inputCtx.callbackQuery?.data === "book:change_date") {
      await inputCtx.answerCallbackQuery();
      dateCtx = inputCtx;
      visitDate = undefined;
      continue;
    }

    if (!inputCtx.message?.text) {
      await inputCtx.reply("Введіть дату текстом (ДД.ММ.РРРР):");
      dateCtx = inputCtx;
      continue;
    }

    const dateStr = inputCtx.message.text.trim();
    const candidate = parseUaDate(dateStr);

    if (!candidate) {
      await inputCtx.reply(
        "Невірний формат дати. Введіть ДД.ММ.РРРР, наприклад 25.05.2026:"
      );
      dateCtx = inputCtx;
      continue;
    }

    const clinicError = validateVisitDate(candidate);
    if (clinicError) {
      await inputCtx.reply(clinicError + "\n\nВведіть іншу дату:");
      dateCtx = inputCtx;
      continue;
    }

    const doctorError = validateDoctorDate(doctor, candidate);
    if (doctorError) {
      await inputCtx.reply(doctorError, { parse_mode: "HTML" });
      dateCtx = inputCtx;
      continue;
    }

    visitDate = candidate;
    dateCtx = inputCtx;
  }

  let slotCtx: MyContext | null = null;
  let datetime: Date | null = null;

  booking: while (!datetime) {
    if (!visitDate) {
      while (!visitDate) {
        await (dateCtx ?? ctx).reply(
          `Введіть дату візиту (ДД.ММ.РРРР):\n🕐 <i>${doctor.schedule}</i>`,
          { parse_mode: "HTML" }
        );
        const retryCtx = await conversation.waitFor([
          "message:text",
          "callback_query:data",
        ]);
        if (retryCtx.callbackQuery?.data === "book:change_date") {
          await retryCtx.answerCallbackQuery();
          dateCtx = retryCtx;
          continue;
        }
        const candidate = parseUaDate(retryCtx.message?.text?.trim() ?? "");
        if (!candidate) {
          await retryCtx.reply("Невірний формат. ДД.ММ.РРРР:");
          dateCtx = retryCtx;
          continue;
        }
        const clinicError = validateVisitDate(candidate);
        if (clinicError) {
          await retryCtx.reply(clinicError);
          dateCtx = retryCtx;
          continue;
        }
        const doctorError = validateDoctorDate(doctor, candidate);
        if (doctorError) {
          await retryCtx.reply(doctorError, { parse_mode: "HTML" });
          dateCtx = retryCtx;
          continue;
        }
        visitDate = candidate;
        dateCtx = retryCtx;
      }
    }

    const dateKey = dateKeyFromDate(visitDate);
    const booked = await conversation.external(() =>
      getBookedSlotTimes(doctor.id, dateKey)
    );
    const slots = getAvailableSlots(doctor, visitDate, booked);

    if (slots.length === 0) {
      await (slotCtx ?? dateCtx!).reply(
        "❌ На цю дату вільних слотів немає (усі зайняті або час уже минув).\n\nВведіть іншу дату (ДД.ММ.РРРР):"
      );
      visitDate = undefined;
      slotCtx = null;
      continue booking;
    }

    await (slotCtx ?? dateCtx!).reply(
      `📅 ${visitDate.toLocaleDateString("uk-UA", { day: "numeric", month: "long", year: "numeric" })}\n\n` +
        `Оберіть час прийому:`,
      {
        reply_markup: buildTimeSlotsKeyboard(
          slots,
          dateKey,
          0,
          slotsPerPage()
        ),
      }
    );

    const pickCtx = await conversation.waitFor("callback_query:data");
    await pickCtx.answerCallbackQuery();
    const data = pickCtx.callbackQuery?.data ?? "";

    if (data === "book:change_date") {
      visitDate = undefined;
      dateCtx = pickCtx;
      slotCtx = null;
      continue booking;
    }

    const pageData = decodeSlotsPageCallback(data);
    if (pageData) {
      const slotsPage = getAvailableSlots(
        doctor,
        visitDate,
        await conversation.external(() =>
          getBookedSlotTimes(doctor.id, pageData.dateKey)
        )
      );
      await pickCtx.editMessageText(
        `📅 ${visitDate.toLocaleDateString("uk-UA", { day: "numeric", month: "long", year: "numeric" })}\n\n` +
          `Оберіть час прийому (стор. ${pageData.page + 1}):`,
        {
          reply_markup: buildTimeSlotsKeyboard(
            slotsPage,
            pageData.dateKey,
            pageData.page,
            slotsPerPage()
          ),
        }
      );
      slotCtx = pickCtx;
      continue booking;
    }

    const slot = decodeSlotCallback(data);
    if (!slot || slot.dateKey !== dateKey) {
      await pickCtx.reply("Оберіть час з кнопок або /book");
      slotCtx = pickCtx;
      continue booking;
    }

    if (!slots.includes(slot.time)) {
      await pickCtx.reply(
        "❌ Цей час недоступний. Оберіть інший слот або іншу дату."
      );
      slotCtx = pickCtx;
      continue booking;
    }

    datetime = buildDateTimeKyiv(visitDate, slot.time);
    slotCtx = pickCtx;
  }

  const iso = datetime.toISOString();
  let flowCtx = slotCtx!;

  let isOnline = false;
  if (doctor.online) {
    const modeKb = new InlineKeyboard()
      .text("🏥 У клініці", "book:mode:offline")
      .text("🌐 Онлайн (Meet)", "book:mode:online");
    await flowCtx.reply("Формат прийому:", { reply_markup: modeKb });
    const modeCtx = await conversation.waitFor("callback_query:data");
    await modeCtx.answerCallbackQuery();
    isOnline = modeCtx.callbackQuery?.data === "book:mode:online";
    flowCtx = modeCtx;
  }

  await flowCtx.reply("Ваше ім'я та прізвище:");
  const nameCtx = await conversation.waitFor("message:text");
  const patientName = nameCtx.message?.text?.trim() ?? "";
  if (patientName.length < 2) {
    await nameCtx.reply("Введіть коректне ім'я.");
    return;
  }

  await nameCtx.reply("Номер телефону для зв'язку:");
  const phoneCtx = await conversation.waitFor("message:text");
  const phone = phoneCtx.message?.text?.trim() ?? "";
  if (phone.length < 9) {
    await phoneCtx.reply("Введіть коректний телефон.");
    return;
  }

  const confirmKb = new InlineKeyboard()
    .text("✅ Підтвердити запис", "book:confirm:yes")
    .text("❌ Скасувати", "book:confirm:no");

  const summary =
    `Перевірте дані:\n\n` +
    `👨‍⚕️ ${doctor.name}\n` +
    `📅 ${datetime.toLocaleString("uk-UA", { timeZone: "Europe/Kyiv" })}\n` +
    `📍 ${isOnline ? "Онлайн (Google Meet)" : "У клініці"}\n` +
    `👤 ${patientName}\n` +
    `📞 ${phone}`;

  await phoneCtx.reply(summary, { reply_markup: confirmKb });

  const confirmCtx = await conversation.waitFor("callback_query:data");
  await confirmCtx.answerCallbackQuery();
  if (confirmCtx.callbackQuery?.data !== "book:confirm:yes") {
    await confirmCtx.reply("Запис скасовано.");
    return;
  }

  const userId = confirmCtx.from?.id;
  if (!userId) return;

  let meetLink: string | undefined;
  if (isOnline) {
    const meet = await createMeetEvent({
      summary: `Консультація — ${config.clinic.name}`,
      description: `Пацієнт: ${patientName}, лікар: ${doctor.name}, тел: ${phone}`,
      startIso: iso,
    });
    meetLink = meet?.meetLink;
    if (!meetLink && config.google.enabled) {
      await confirmCtx.reply(
        "⚠️ Meet не створено (перевірте Google Calendar). Запис збережено без посилання."
      );
    }
  }

  const appt = await conversation.external(() =>
    createAppointment({
      userId,
      username: confirmCtx.from?.username,
      patientName,
      phone,
      doctorId: doctor.id,
      datetime: iso,
      isOnline,
      meetLink,
    })
  );

  if (meetLink) {
    await conversation.external(() => setMeetLink(appt.id, meetLink!));
  }

  await confirmCtx.reply(
    `✅ <b>Заявку прийнято!</b>\n\n${formatAppointmentForUser(appt)}\n\nАдміністратор підтвердить запис. Нагадування надійде перед візитом.`,
    { parse_mode: "HTML" }
  );

  await conversation.external(() => notifyAdminsNewAppointment(confirmCtx.api, appt));
}

function doctorsKeyboard(): InlineKeyboard {
  const kb = new InlineKeyboard();
  for (const d of config.doctors) {
    kb.text(d.name, `book:doctor:${d.id}`).row();
  }
  kb.text("❌ Скасувати", "book:cancel");
  return kb;
}
