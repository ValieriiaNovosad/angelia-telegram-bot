import { createBot } from "./bot.js";
import { config } from "./config.js";
import { registerBotCommands } from "./services/botCommands.js";
import { startReminderScheduler } from "./services/reminders.js";

const bot = createBot();

await registerBotCommands(bot);

if (config.adminChatIds.length === 0) {
  console.warn(
    "⚠️ ADMIN_CHAT_IDS не задано — адміністратор не отримуватиме сповіщення"
  );
}

startReminderScheduler(bot);

console.log(`🏥 Бот «${config.clinic.name}» запущено...`);
await bot.start({
  drop_pending_updates: true,
  onStart: (info) => console.log(`✅ @${info.username} готовий до роботи`),
});
