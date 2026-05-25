import type { Bot } from "grammy";
import { config } from "../config.js";
import type { MyContext } from "../bot.js";

const USER_COMMANDS = [
  { command: "start", description: "Головне меню" },
  { command: "help", description: "Довідка" },
  { command: "info", description: "Контакти та графік" },
  { command: "directions", description: "Напрямки клініки" },
  { command: "guide", description: "Довідник пацієнта" },
  { command: "doctors", description: "Лікарі" },
  { command: "price", description: "Прайс" },
  { command: "book", description: "Запис на прийом" },
  { command: "my", description: "Мої записи" },
] as const;

const ADMIN_EXTRA_COMMANDS = [
  { command: "appointments", description: "Записи на підтвердження" },
  { command: "confirm", description: "Підтвердити запис (ID)" },
  { command: "cancel", description: "Скасувати запис (ID)" },
  { command: "remind", description: "Демо-нагадування (ID)" },
] as const;

export async function registerBotCommands(bot: Bot<MyContext>): Promise<void> {
  await bot.api.setMyCommands([...USER_COMMANDS]);

  const adminCommands = [...USER_COMMANDS, ...ADMIN_EXTRA_COMMANDS];
  for (const chatId of config.adminChatIds) {
    await bot.api.setMyCommands(adminCommands, {
      scope: { type: "chat", chat_id: chatId },
    });
  }
}
