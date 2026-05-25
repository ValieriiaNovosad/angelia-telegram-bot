import type { Bot } from "grammy";
import type { MyContext } from "../bot.js";
import { autoReplyMessage } from "../content/messages.js";
import { mainInlineMenu } from "../keyboards/main.js";
import { matchConsultant } from "../utils/consultant.js";

export function registerFallbackHandlers(bot: Bot<MyContext>): void {
  bot.on("message:text", async (ctx, next) => {
    const active = await ctx.conversation.active();
    if (active) {
      return next();
    }

    const text = ctx.message.text.trim();
    const consultant = matchConsultant(text);

    if (consultant) {
      await ctx.reply(consultant.text, { parse_mode: consultant.parseMode });
      return;
    }

    await ctx.reply(autoReplyMessage(), {
      parse_mode: "HTML",
      reply_markup: mainInlineMenu(),
    });
  });
}
