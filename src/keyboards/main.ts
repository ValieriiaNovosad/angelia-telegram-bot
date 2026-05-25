import { InlineKeyboard, Keyboard } from "grammy";
import { config } from "../config.js";

export const mainReplyKeyboard = new Keyboard()
  .text("ℹ️ Інформація")
  .text("🏥 Напрямки")
  .row()
  .text("💰 Прайс")
  .text("📚 Довідник")
  .row()
  .text("📅 Запис")
  .text("👨‍⚕️ Лікарі")
  .row()
  .text("📋 Мої записи")
  .text("💬 Адміну")
  .resized()
  .persistent();

export function mainInlineMenu(): InlineKeyboard {
  return new InlineKeyboard()
    .text("ℹ️ Контакти та графік", "menu:info")
    .row()
    .text("🏥 Напрямки", "menu:directions")
    .text("📚 Довідник", "menu:guide")
    .row()
    .text("💰 Прайс", "menu:services")
    .text("👨‍⚕️ Лікарі", "menu:doctors")
    .row()
    .text("📅 Записатися", "menu:book")
    .text("📋 Мої записи", "menu:my")
    .row()
    .text("💬 Адміну", "menu:admin");
}

export function doctorsInlineKeyboard(): InlineKeyboard {
  const kb = new InlineKeyboard();
  for (const d of config.doctors) {
    kb.text(d.name.split(" ")[0] + "…", `doctor:${d.id}`).row();
  }
  kb.text("◀️ Назад", "menu:main");
  return kb;
}
