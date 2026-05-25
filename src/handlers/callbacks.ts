import type { Bot } from "grammy";
import { InlineKeyboard } from "grammy";
import { getDoctor } from "../config.js";
import { config, getDirection } from "../config.js";
import {
  clinicInfoMessage,
  directionDetailMessage,
  directionsListMessage,
  doctorMessage,
  doctorsListMessage,
  handbookMenuMessage,
  handbookSectionMessage,
  priceMenuMessage,
  serviceCategoryMessage,
  servicesMessage,
} from "../content/messages.js";
import {
  directionsMenuKeyboard,
  handbookMenuKeyboard,
  priceMenuKeyboard,
} from "../keyboards/price.js";
import {
  doctorsInlineKeyboard,
  mainInlineMenu,
} from "../keyboards/main.js";
import {
  getAppointmentById,
  getUserAppointments,
  updateAppointmentStatus,
} from "../db/database.js";
import {
  formatAppointmentForAdmin,
  formatAppointmentForUser,
  notifyAdmins,
} from "../services/notifications.js";
import type { MyContext } from "../bot.js";

export function registerCallbacks(bot: Bot<MyContext>): void {
  bot.callbackQuery(/^menu:/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const action = ctx.callbackQuery.data.replace("menu:", "");

    switch (action) {
      case "main":
        await ctx.editMessageText("Головне меню:", {
          reply_markup: mainInlineMenu(),
        });
        break;
      case "info":
        await ctx.editMessageText(clinicInfoMessage(), {
          parse_mode: "HTML",
          reply_markup: backKeyboard(),
        });
        break;
      case "doctors":
        await ctx.editMessageText(doctorsListMessage(), {
          parse_mode: "HTML",
          reply_markup: doctorsInlineKeyboard(),
        });
        break;
      case "services":
        await ctx.editMessageText(priceMenuMessage(), {
          parse_mode: "HTML",
          reply_markup: priceMenuKeyboard(),
        });
        break;
      case "directions":
        await ctx.editMessageText(directionsListMessage(), {
          parse_mode: "HTML",
          reply_markup: directionsMenuKeyboard(),
        });
        break;
      case "guide":
        await ctx.editMessageText(handbookMenuMessage(), {
          parse_mode: "HTML",
          reply_markup: handbookMenuKeyboard(),
        });
        break;
      case "book":
        await ctx.conversation.enter("bookingConversation");
        break;
      case "admin":
        await ctx.conversation.enter("adminMessageConversation");
        break;
      case "my":
        await showMyAppointments(ctx);
        break;
    }
  });

  bot.callbackQuery(/^doctor:/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const id = ctx.callbackQuery.data.replace("doctor:", "");
    const doctor = getDoctor(id);
    if (!doctor) {
      await ctx.editMessageText("Лікар не знайдений.");
      return;
    }
    const kb = new InlineKeyboard()
      .text("📅 Записатися", `book:doctor:${id}`)
      .row()
      .text("◀️ До списку", "menu:doctors");
    await ctx.editMessageText(doctorMessage(doctor), {
      parse_mode: "HTML",
      reply_markup: kb,
    });
  });

  bot.callbackQuery(/^price:/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const data = ctx.callbackQuery.data;

    if (data === "price:all") {
      await ctx.editMessageText(servicesMessage(config.services), {
        parse_mode: "HTML",
        reply_markup: priceMenuKeyboard(),
      });
      return;
    }

    const index = Number(data.replace("price:cat:", ""));
    const cat = config.services[index];
    if (!cat) {
      await ctx.editMessageText("Категорію не знайдено.");
      return;
    }
    await ctx.editMessageText(serviceCategoryMessage(cat), {
      parse_mode: "HTML",
      reply_markup: priceMenuKeyboard(),
    });
  });

  bot.callbackQuery(/^direction:/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const id = ctx.callbackQuery.data.replace("direction:", "");
    const dir = getDirection(id);
    if (!dir) {
      await ctx.editMessageText("Напрямок не знайдено.");
      return;
    }
    const kb = new InlineKeyboard()
      .text("📅 Записатися", "menu:book")
      .row()
      .text("◀️ До напрямків", "menu:directions");
    await ctx.editMessageText(directionDetailMessage(dir), {
      parse_mode: "HTML",
      reply_markup: kb,
    });
  });

  bot.callbackQuery(/^handbook:/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const id = ctx.callbackQuery.data.replace("handbook:", "");
    const section = config.handbook.find((s) => s.id === id);
    if (!section) {
      await ctx.editMessageText("Розділ не знайдено.");
      return;
    }
    const kb = new InlineKeyboard()
      .text("◀️ До довідника", "menu:guide");
    await ctx.editMessageText(handbookSectionMessage(section), {
      parse_mode: "HTML",
      reply_markup: kb,
    });
  });

  bot.callbackQuery(/^book:doctor:/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const doctorId = ctx.callbackQuery.data.replace("book:doctor:", "");
    await ctx.conversation.enter("bookingConversation", doctorId);
  });

  bot.callbackQuery(/^confirm:/, async (ctx) => {
    const id = Number(ctx.callbackQuery.data.replace("confirm:", ""));
    const appt = getAppointmentById(id);
    if (!appt || appt.user_id !== ctx.from?.id) {
      await ctx.answerCallbackQuery({ text: "Запис не знайдено" });
      return;
    }
    updateAppointmentStatus(id, "confirmed");
    await ctx.answerCallbackQuery({ text: "Візит підтверджено!" });
    await ctx.editMessageText(
      `✅ Дякуємо! Візит підтверджено.\n\n${formatAppointmentForUser({ ...appt, status: "confirmed" })}`
    );
    await notifyAdmins(
      ctx.api,
      `✅ Пацієнт підтвердив візит #${id}\n${formatAppointmentForAdmin({ ...appt, status: "confirmed" })}`
    );
  });

  bot.callbackQuery(/^cancel:/, async (ctx) => {
    const id = Number(ctx.callbackQuery.data.replace("cancel:", ""));
    const appt = getAppointmentById(id);
    if (!appt || appt.user_id !== ctx.from?.id) {
      await ctx.answerCallbackQuery({ text: "Запис не знайдено" });
      return;
    }
    updateAppointmentStatus(id, "cancelled");
    await ctx.answerCallbackQuery({ text: "Запис скасовано" });
    await ctx.editMessageText(`❌ Запис #${id} скасовано.`);
    await notifyAdmins(
      ctx.api,
      `❌ Пацієнт скасував візит #${id}\n${formatAppointmentForAdmin({ ...appt, status: "cancelled" })}`
    );
  });
}

function backKeyboard(): InlineKeyboard {
  return new InlineKeyboard().text("◀️ Назад", "menu:main");
}

async function showMyAppointments(ctx: MyContext): Promise<void> {
  const userId = ctx.from?.id;
  if (!userId) return;

  const list = getUserAppointments(userId);
  if (list.length === 0) {
    await ctx.editMessageText("У вас поки немає записів.", {
      reply_markup: backKeyboard(),
    });
    return;
  }

  const text = list.map((a) => formatAppointmentForUser(a)).join("\n\n---\n\n");
  await ctx.editMessageText(`📋 <b>Ваші записи</b>\n\n${text}`, {
    parse_mode: "HTML",
    reply_markup: backKeyboard(),
  });
}
