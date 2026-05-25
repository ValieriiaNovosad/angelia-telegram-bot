import { config, getDoctor } from "../config.js";
import type {
  ClinicDirection,
  Doctor,
  HandbookSection,
  ServiceCategory,
} from "../types.js";
import { isReceptionOpen } from "../utils/clinicHours.js";

export function welcomeMessage(): string {
  return (
    `Вітаємо в ${config.clinic.name}! 🏥\n\n` +
    `${config.clinic.support247}\n\n` +
    `Я ваш <b>консультант</b> та помічник:\n` +
    `• адреса, <b>графік</b>, як дістатися\n` +
    `• <b>напрямки</b> медицини в клініці\n` +
    `• <b>повний прайс</b> та довідник (стаціонар, підготовка до обстежень)\n` +
    `• запис на прийом та нагадування\n\n` +
    `Пишіть питання текстом або оберіть меню 👇`
  );
}

export function clinicInfoMessage(): string {
  const c = config.clinic;
  const receptionNow = isReceptionOpen()
    ? "🟢 Зараз ресепшн, ймовірно, <b>відкритий</b> (за графіком)."
    : "🔴 Зараз ресепшн <b>закритий</b> (поза графіком). Бот відповідає <b>24/7</b>.";

  return (
    `📍 <b>${c.name}</b>\n\n` +
    `📌 <b>Адреса:</b> ${c.address}\n` +
    `📞 <b>Телефон:</b> ${c.phone}\n` +
    `✉️ <b>Email:</b> ${c.email}\n\n` +
    `🕐 <b>Графік роботи клініки:</b>\n` +
    `${c.schedule.weekdays}\n` +
    `${c.schedule.friday}\n` +
    `${c.schedule.weekend}\n\n` +
    `${receptionNow}\n\n` +
    `${c.support247}\n\n` +
    `🗺 <b>Як дістатися:</b>\n${c.directions}`
  );
}

/** Автовідповідь на довільний текст, коли адмінів немає або пацієнт пише вночі */
export function autoReplyMessage(): string {
  const open = isReceptionOpen();
  const status = open
    ? "🟢 Ресепшн за графіком <b>відкритий</b> — адміністратор може відповісти найближчим часом."
    : "🔴 Ресепшн <b>закритий</b> — адміністратори поза зміною, але <b>я працюю 24/7</b>.";

  return (
    `${status}\n\n` +
    `Оберіть, що вас цікавить:\n` +
    `• /info — адреса, <b>графік</b>, контакти\n` +
    `• /directions — напрямки клініки\n` +
    `• /guide — довідник (стаціонар, документи…)\n` +
    `• /price — повний прайс\n` +
    `• /book — запис\n` +
    `• /my — мої записи\n\n` +
    `Або натисніть /start для меню.`
  );
}

export function doctorMessage(doctor: Doctor): string {
  const online = doctor.online
    ? "\n🌐 Доступні онлайн-консультації (Google Meet)"
    : "";
  return (
    `👨‍⚕️ <b>${doctor.name}</b>\n` +
    `Спеціальність: ${doctor.specialty}\n` +
    `🕐 Графік: ${doctor.schedule}\n` +
    `🚪 ${doctor.room}\n\n` +
    `${doctor.bio}${online}`
  );
}

export function doctorsListMessage(): string {
  const lines = config.doctors.map(
    (d, i) => `${i + 1}. <b>${d.name}</b> — ${d.specialty}\n   🕐 ${d.schedule}`
  );
  return `👨‍⚕️ <b>Наші лікарі</b>\n\n${lines.join("\n\n")}\n\nОберіть лікаря для деталей:`;
}

export function helpMessage(): string {
  return (
    `📖 <b>Довідка — ${config.clinic.name}</b>\n\n` +
    `<b>Команди:</b>\n` +
    `/start — головне меню\n` +
    `/info — адреса, телефон, графік\n` +
    `/doctors — лікарі\n` +
    `/price — повний прайс (за категоріями)\n` +
    `/directions — напрямки медицини\n` +
    `/guide — довідник (стаціонар, оплата…)\n` +
    `/book — запис на прийом\n` +
    `/my — мої записи\n` +
    `/help — ця довідка\n\n` +
    `<b>Консультант:</b> напишіть питання текстом (графік, стаціонар, ціни, УЗД…).\n\n` +
    `<b>Запис:</b> лікар → дата (за графіком лікаря) → <b>час з кнопок</b> → формат → ім'я → телефон.\n\n` +
    `<b>Нагадування:</b> за добу до візиту з кнопками підтвердження або скасування.\n\n` +
    `<b>24/7:</b> бот відповідає цілодобово; живий адміністратор — у години роботи клініки (/info).`
  );
}

export function adminHelpMessage(): string {
  return (
    `🔐 <b>Команди адміністратора</b>\n\n` +
    `/appointments — записи «очікує»\n` +
    `/confirm ID — підтвердити запис\n` +
    `/cancel ID — скасувати запис\n` +
    `/remind ID — демо-нагадування пацієнту зараз\n\n` +
    `У сповіщеннях про новий запис є кнопки ✅ / ❌.`
  );
}

export function priceMenuMessage(): string {
  return (
    `💰 <b>Прайс</b>\n\n` +
    `Оберіть категорію або «Повний прайс» для перегляду всіх послуг.\n\n` +
    `<i>Актуальні ціни уточнюйте на ресепшені.</i>`
  );
}

export function servicesMessage(categories: ServiceCategory[]): string {
  const blocks = categories.map((cat) => serviceCategoryBlock(cat));
  return (
    `💰 <b>Повний прайс — ${config.clinic.name}</b>\n\n` +
    `${blocks.join("\n\n")}\n\n` +
    `<i>Актуальні ціни уточнюйте на ресепшені.</i>`
  );
}

export function serviceCategoryMessage(cat: ServiceCategory): string {
  return (
    `💰 <b>${cat.category}</b>\n\n` +
    `${serviceCategoryBlock(cat)}\n\n` +
    `<i>Інші категорії — /price</i>`
  );
}

function serviceCategoryBlock(cat: ServiceCategory): string {
  const items = cat.items
    .map((i) => `  • ${i.name} — <b>${i.price}</b>`)
    .join("\n");
  return `<b>${cat.category}</b>\n${items}`;
}

export function directionsListMessage(): string {
  const lines = config.directions.map(
    (d, i) => `${i + 1}. <b>${d.title}</b>\n   ${d.summary}`
  );
  return (
    `🏥 <b>Напрямки клініки</b>\n\n` +
    `${lines.join("\n\n")}\n\n` +
    `Оберіть напрямок для деталей або запишіться: /book`
  );
}

export function directionDetailMessage(dir: ClinicDirection): string {
  const services = dir.services.map((s) => `  • ${s}`).join("\n");
  const doctors = dir.doctorIds
    .map((id) => getDoctor(id)?.name ?? id)
    .map((n) => `  • ${n}`)
    .join("\n");

  return (
    `🏥 <b>${dir.title}</b>\n\n` +
    `${dir.summary}\n\n` +
    `<b>Послуги:</b>\n${services}\n\n` +
    `<b>Лікарі:</b>\n${doctors}\n\n` +
    `📅 Запис: /book`
  );
}

export function handbookMenuMessage(): string {
  const lines = config.handbook.map((s) => `${s.icon} <b>${s.title}</b>`);
  return (
    `📚 <b>Довідник пацієнта</b>\n\n` +
    `${lines.join("\n")}\n\n` +
    `Оберіть розділ нижче 👇`
  );
}

export function handbookSectionMessage(section: HandbookSection): string {
  return `${section.icon} <b>${section.title}</b>\n\n${section.content}`;
}
