import type { Conversation } from "@grammyjs/conversations";
import type { MyContext } from "../bot.js";
import { config } from "../config.js";
import { notifyAdmins } from "../services/notifications.js";
import { isReceptionOpen } from "../utils/clinicHours.js";

type AdminMsgConversation = Conversation<MyContext, MyContext>;

export async function adminMessageConversation(
  conversation: AdminMsgConversation,
  ctx: MyContext
): Promise<void> {
  await ctx.reply(
    "💬 Напишіть повідомлення для адміністратора клініки (одним текстом):"
  );

  const msgCtx = await conversation.waitFor("message:text");
  const text = msgCtx.message?.text?.trim();
  if (!text) {
    await msgCtx.reply("Порожнє повідомлення. Скасовано.");
    return;
  }

  const user = msgCtx.from;
  const header =
    `💬 <b>Повідомлення від пацієнта</b>\n` +
    `👤 ${user?.first_name ?? ""} ${user?.last_name ?? ""}\n` +
    `🆔 ${user?.id}${user?.username ? ` (@${user.username})` : ""}\n\n`;

  await conversation.external(() =>
    notifyAdmins(msgCtx.api, header + text)
  );

  const hoursNote = isReceptionOpen()
    ? "Адміністратор відповість найближчим часом (ресепшн за графіком відкритий)."
    : "Ресепшн зараз закритий — адміністратор відповість у робочі години клініки. Бот доступний 24/7: /info, /book.";

  await msgCtx.reply(
    `✅ Дякуємо! Ваше повідомлення передано адміністратору.\n\n<i>${hoursNote}</i>`,
    { parse_mode: "HTML" }
  );
}
