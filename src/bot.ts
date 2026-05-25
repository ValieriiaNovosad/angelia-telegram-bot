import { Bot, GrammyError, session } from "grammy";
import {
  type ConversationFlavor,
  conversations,
  createConversation,
} from "@grammyjs/conversations";
import { config } from "./config.js";
import { bookingConversation } from "./conversations/booking.js";
import { adminMessageConversation } from "./conversations/adminMessage.js";
import { registerAdminHandlers } from "./handlers/admin.js";
import { registerCommands } from "./handlers/commands.js";
import { registerCallbacks } from "./handlers/callbacks.js";
import { registerFallbackHandlers } from "./handlers/fallback.js";

export type SessionData = Record<string, never>;

export type MyContext = ConversationFlavor<
  import("grammy").Context & { session: SessionData }
>;

export function createBot(): Bot<MyContext> {
  const bot = new Bot<MyContext>(config.botToken);

  bot.use(
    session({
      initial: (): SessionData => ({}),
    })
  );

  bot.use(conversations());
  bot.use(createConversation(bookingConversation, "bookingConversation"));
  bot.use(
    createConversation(adminMessageConversation, "adminMessageConversation")
  );

  registerCommands(bot);
  registerAdminHandlers(bot);
  registerCallbacks(bot);
  registerFallbackHandlers(bot);

  bot.catch((err) => {
    const e = err.error;
    if (e instanceof GrammyError) {
      if (e.error_code === 409) {
        console.error(
          "⚠️ Запущено дві копії бота одночасно (409 Conflict).\n" +
            "   Зупиніть усі термінали з npm run dev / npm start і запустіть лише один процес."
        );
        process.exit(1);
      }
      if (e.error_code === 401) {
        console.error(
          "⚠️ Невірний BOT_TOKEN (401). Оновіть токен у .env від @BotFather."
        );
        process.exit(1);
      }
    }
    console.error("Помилка бота:", err);
  });

  return bot;
}
