import { InlineKeyboard } from "grammy";
import { config } from "../config.js";

export function priceMenuKeyboard(): InlineKeyboard {
  const kb = new InlineKeyboard()
    .text("📋 Повний прайс", "price:all")
    .row();

  config.services.forEach((cat, index) => {
    kb.text(cat.category, `price:cat:${index}`).row();
  });

  kb.text("◀️ Назад", "menu:main");
  return kb;
}

export function directionsMenuKeyboard(): InlineKeyboard {
  const kb = new InlineKeyboard();
  for (const d of config.directions) {
    kb.text(d.title, `direction:${d.id}`).row();
  }
  kb.text("◀️ Назад", "menu:main");
  return kb;
}

export function handbookMenuKeyboard(): InlineKeyboard {
  const kb = new InlineKeyboard();
  for (const s of config.handbook) {
    kb.text(`${s.icon} ${s.title}`, `handbook:${s.id}`).row();
  }
  kb.text("◀️ Назад", "menu:main");
  return kb;
}
