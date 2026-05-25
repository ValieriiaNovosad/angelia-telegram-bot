import type { Bot } from "grammy";
import {
  adminHelpMessage,
  clinicInfoMessage,
  directionsListMessage,
  doctorsListMessage,
  handbookMenuMessage,
  helpMessage,
  priceMenuMessage,
  welcomeMessage,
} from "../content/messages.js";
import { isAdmin } from "../utils/admin.js";
import {
  directionsMenuKeyboard,
  handbookMenuKeyboard,
  priceMenuKeyboard,
} from "../keyboards/price.js";
import {
  doctorsInlineKeyboard,
  mainInlineMenu,
  mainReplyKeyboard,
} from "../keyboards/main.js";
import { config } from "../config.js";
import type { MyContext } from "../bot.js";
import { getUserAppointments } from "../db/database.js";
import { formatAppointmentForUser } from "../services/notifications.js";

export function registerCommands(bot: Bot<MyContext>): void {
  bot.command("start", async (ctx) => {
    await ctx.reply(welcomeMessage(), {
      parse_mode: "HTML",
      reply_markup: mainReplyKeyboard,
    });
    await ctx.reply("Або оберіть у меню:", {
      reply_markup: mainInlineMenu(),
    });
  });

  bot.command("info", async (ctx) => {
    await ctx.reply(clinicInfoMessage(), { parse_mode: "HTML" });
  });

  bot.command("doctors", async (ctx) => {
    await ctx.reply(doctorsListMessage(), {
      parse_mode: "HTML",
      reply_markup: doctorsInlineKeyboard(),
    });
  });

  bot.command("price", async (ctx) => {
    await ctx.reply(priceMenuMessage(), {
      parse_mode: "HTML",
      reply_markup: priceMenuKeyboard(),
    });
  });

  bot.command("directions", async (ctx) => {
    await ctx.reply(directionsListMessage(), {
      parse_mode: "HTML",
      reply_markup: directionsMenuKeyboard(),
    });
  });

  bot.command("guide", async (ctx) => {
    await ctx.reply(handbookMenuMessage(), {
      parse_mode: "HTML",
      reply_markup: handbookMenuKeyboard(),
    });
  });

  bot.command("book", async (ctx) => {
    await ctx.conversation.enter("bookingConversation");
  });

  bot.command("help", async (ctx) => {
    await ctx.reply(helpMessage(), { parse_mode: "HTML" });
    if (isAdmin(ctx.from?.id)) {
      await ctx.reply(adminHelpMessage(), { parse_mode: "HTML" });
    }
  });

  bot.command("my", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const list = getUserAppointments(userId);
    if (list.length === 0) {
      await ctx.reply("У вас поки немає записів.");
      return;
    }
    const text = list.map((a) => formatAppointmentForUser(a)).join("\n\n---\n\n");
    await ctx.reply(text);
  });

  bot.hears("ℹ️ Інформація", async (ctx) => {
    await ctx.reply(clinicInfoMessage(), { parse_mode: "HTML" });
  });

  bot.hears("🏥 Напрямки", async (ctx) => {
    await ctx.reply(directionsListMessage(), {
      parse_mode: "HTML",
      reply_markup: directionsMenuKeyboard(),
    });
  });

  bot.hears("📚 Довідник", async (ctx) => {
    await ctx.reply(handbookMenuMessage(), {
      parse_mode: "HTML",
      reply_markup: handbookMenuKeyboard(),
    });
  });

  bot.hears("💰 Прайс", async (ctx) => {
    await ctx.reply(priceMenuMessage(), {
      parse_mode: "HTML",
      reply_markup: priceMenuKeyboard(),
    });
  });

  bot.hears("👨‍⚕️ Лікарі", async (ctx) => {
    await ctx.reply(doctorsListMessage(), {
      parse_mode: "HTML",
      reply_markup: doctorsInlineKeyboard(),
    });
  });

  bot.hears("📅 Запис", async (ctx) => {
    await ctx.conversation.enter("bookingConversation");
  });

  bot.hears("📋 Мої записи", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const list = getUserAppointments(userId);
    if (list.length === 0) {
      await ctx.reply("У вас поки немає записів.");
      return;
    }
    const text = list.map((a) => formatAppointmentForUser(a)).join("\n\n---\n\n");
    await ctx.reply(text);
  });

  bot.hears("💬 Адміну", async (ctx) => {
    await ctx.conversation.enter("adminMessageConversation");
  });

  bot.hears("💬 Повідомлення адміну", async (ctx) => {
    await ctx.conversation.enter("adminMessageConversation");
  });
}
