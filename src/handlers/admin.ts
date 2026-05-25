import type { Bot } from "grammy";
import type { Api, RawApi } from "grammy";
import type { MyContext } from "../bot.js";
import {
  getAppointmentById,
  getPendingAppointments,
  resetReminderSent,
  updateAppointmentStatus,
} from "../db/database.js";
import {
  formatAppointmentForAdmin,
  formatAppointmentForUser,
} from "../services/notifications.js";
import { sendAppointmentReminder } from "../services/reminders.js";
import { isAdmin } from "../utils/admin.js";

type BotApi = Api<RawApi>;

export function registerAdminHandlers(bot: Bot<MyContext>): void {
  bot.command("appointments", async (ctx) => {
    if (!requireAdmin(ctx)) return;

    const list = getPendingAppointments();
    if (list.length === 0) {
      await ctx.reply("Немає записів зі статусом «очікує».");
      return;
    }

    const text = list
      .map((a) => formatAppointmentForAdmin(a))
      .join("\n\n---\n\n");
    await ctx.reply(
      `📋 <b>Очікують підтвердження (${list.length})</b>\n\n${text}\n\n` +
        `Команди: /confirm ID · /cancel ID · /remind ID`,
      { parse_mode: "HTML" }
    );
  });

  bot.command("confirm", async (ctx) => {
    if (!requireAdmin(ctx)) return;
    const id = parseCommandId(ctx.message?.text);
    if (!id) {
      await ctx.reply("Використання: /confirm 5");
      return;
    }
    await adminConfirmAppointment(ctx.api, id, (msg) => ctx.reply(msg, { parse_mode: "HTML" }));
  });

  bot.command("cancel", async (ctx) => {
    if (!requireAdmin(ctx)) return;
    const id = parseCommandId(ctx.message?.text);
    if (!id) {
      await ctx.reply("Використання: /cancel 5");
      return;
    }
    await adminCancelAppointment(ctx.api, id, (msg) => ctx.reply(msg, { parse_mode: "HTML" }));
  });

  bot.command("remind", async (ctx) => {
    if (!requireAdmin(ctx)) return;
    const id = parseCommandId(ctx.message?.text);
    if (!id) {
      await ctx.reply(
        "🧪 <b>Демо-нагадування</b>\n\nВикористання: /remind 5\n\n" +
          "Надішле пацієнту нагадування зараз (без очікування 24 год).",
        { parse_mode: "HTML" }
      );
      return;
    }

    const appt = getAppointmentById(id);
    if (!appt) {
      await ctx.reply(`Запис #${id} не знайдено.`);
      return;
    }

    if (appt.status === "cancelled") {
      await ctx.reply(`Запис #${id} уже скасовано.`);
      return;
    }

    resetReminderSent(id);
    const sent = await sendAppointmentReminder(bot, appt, {
      demo: true,
      force: true,
    });

    if (sent) {
      await ctx.reply(
        `🧪 Демо-нагадування надіслано пацієнту (запис #${id}).`,
        { parse_mode: "HTML" }
      );
    } else {
      await ctx.reply(
        `Не вдалося надіслати нагадування для #${id} (перевірте, чи пацієнт писав боту).`
      );
    }
  });

  bot.callbackQuery(/^admin:confirm:/, async (ctx) => {
    if (!requireAdmin(ctx)) return;
    await ctx.answerCallbackQuery();
    const id = Number(ctx.callbackQuery.data.replace("admin:confirm:", ""));
    await adminConfirmAppointment(ctx.api, id, async (msg) => {
      await ctx.editMessageText(msg, { parse_mode: "HTML" });
    });
  });

  bot.callbackQuery(/^admin:cancel:/, async (ctx) => {
    if (!requireAdmin(ctx)) return;
    await ctx.answerCallbackQuery();
    const id = Number(ctx.callbackQuery.data.replace("admin:cancel:", ""));
    await adminCancelAppointment(ctx.api, id, async (msg) => {
      await ctx.editMessageText(msg, { parse_mode: "HTML" });
    });
  });
}

function requireAdmin(ctx: MyContext): boolean {
  if (!isAdmin(ctx.from?.id)) {
    void ctx.reply("Ця команда лише для адміністратора.");
    return false;
  }
  return true;
}

function parseCommandId(text: string | undefined): number | null {
  const part = text?.trim().split(/\s+/)[1];
  const id = Number(part);
  return Number.isFinite(id) && id > 0 ? id : null;
}

async function adminConfirmAppointment(
  api: BotApi,
  id: number,
  reply: (msg: string) => Promise<unknown>
): Promise<void> {
  const appt = getAppointmentById(id);
  if (!appt) {
    await reply(`Запис #${id} не знайдено.`);
    return;
  }
  if (appt.status === "cancelled") {
    await reply(`Запис #${id} уже скасовано.`);
    return;
  }
  if (appt.status === "confirmed") {
    await reply(`Запис #${id} уже підтверджено.`);
    return;
  }

  updateAppointmentStatus(id, "confirmed");
  const updated = { ...appt, status: "confirmed" as const };

  try {
    await api.sendMessage(
      appt.user_id,
      `✅ <b>Запис підтверджено</b>\n\n${formatAppointmentForUser(updated)}`,
      { parse_mode: "HTML" }
    );
  } catch (err) {
    console.error(`Повідомлення пацієнту #${id}:`, err);
  }

  await reply(
    `✅ Запис #${id} підтверджено адміністратором.\n\n${formatAppointmentForAdmin(updated)}`
  );
}

async function adminCancelAppointment(
  api: BotApi,
  id: number,
  reply: (msg: string) => Promise<unknown>
): Promise<void> {
  const appt = getAppointmentById(id);
  if (!appt) {
    await reply(`Запис #${id} не знайдено.`);
    return;
  }
  if (appt.status === "cancelled") {
    await reply(`Запис #${id} уже скасовано.`);
    return;
  }

  updateAppointmentStatus(id, "cancelled");
  const updated = { ...appt, status: "cancelled" as const };

  try {
    await api.sendMessage(
      appt.user_id,
      `❌ <b>Запис скасовано</b>\n\n${formatAppointmentForUser(updated)}\n\nЗа потреби запишіться знову: /book`,
      { parse_mode: "HTML" }
    );
  } catch (err) {
    console.error(`Повідомлення пацієнту #${id}:`, err);
  }

  await reply(
    `❌ Запис #${id} скасовано адміністратором.\n\n${formatAppointmentForAdmin(updated)}`
  );
}
