import { config } from "../config.js";
import {
  clinicInfoMessage,
  directionDetailMessage,
  directionsListMessage,
  handbookSectionMessage,
  handbookMenuMessage,
  servicesMessage,
} from "../content/messages.js";

export type ConsultantReply = {
  text: string;
  parseMode: "HTML";
};

const RULES: { pattern: RegExp; reply: () => ConsultantReply }[] = [
  {
    pattern: /адрес|де знаход|розташув|метро|доїхати|дістатися|локаці/i,
    reply: () => ({ text: clinicInfoMessage(), parseMode: "HTML" }),
  },
  {
    pattern: /графік|коли працю|годин|відкрит|вихідн|неділя|субота|працюєте/i,
    reply: () => ({ text: clinicInfoMessage(), parseMode: "HTML" }),
  },
  {
    pattern: /телефон|подзвон|зв.?язати|контакт/i,
    reply: () => ({ text: clinicInfoMessage(), parseMode: "HTML" }),
  },
  {
    pattern: /прайс|цін|вартість|скільки кошт|послуг/i,
    reply: () => ({
      text: servicesMessage(config.services),
      parseMode: "HTML",
    }),
  },
  {
    pattern: /стаціонар|госпітал|палат|лежач|добовий/i,
    reply: () => {
      const section = config.handbook.find((s) => s.id === "inpatient");
      return section
        ? { text: handbookSectionMessage(section), parseMode: "HTML" }
        : { text: handbookMenuMessage(), parseMode: "HTML" };
    },
  },
  {
    pattern: /узд|кардіо|терап|напрям|спеціал|лікар|консультац/i,
    reply: () => ({ text: directionsListMessage(), parseMode: "HTML" }),
  },
  {
    pattern: /документ|довідк|направлен/i,
    reply: () => {
      const section = config.handbook.find((s) => s.id === "documents");
      return section
        ? { text: handbookSectionMessage(section), parseMode: "HTML" }
        : { text: handbookMenuMessage(), parseMode: "HTML" };
    },
  },
  {
    pattern: /оплат|картк|готівк/i,
    reply: () => {
      const section = config.handbook.find((s) => s.id === "payment");
      return section
        ? { text: handbookSectionMessage(section), parseMode: "HTML" }
        : { text: handbookMenuMessage(), parseMode: "HTML" };
    },
  },
  {
    pattern: /підготов|натще|обстеж|анализ|аналіз/i,
    reply: () => {
      const section = config.handbook.find((s) => s.id === "preparation");
      return section
        ? { text: handbookSectionMessage(section), parseMode: "HTML" }
        : { text: handbookMenuMessage(), parseMode: "HTML" };
    },
  },
  {
    pattern: /запис|записат|прийом|запиш/i,
    reply: () => ({
      text:
        "📅 <b>Запис на прийом</b>\n\nКоманда /book або кнопка «📅 Запис».\n\n" +
        "Оберіть лікаря, дату (Пн–Пт) та час з доступних слотів.",
      parseMode: "HTML",
    }),
  },
];

export function matchConsultant(text: string): ConsultantReply | null {
  const normalized = text.trim();
  for (const rule of RULES) {
    if (rule.pattern.test(normalized)) {
      return rule.reply();
    }
  }

  for (const dir of config.directions) {
    if (normalized.toLowerCase().includes(dir.title.toLowerCase().slice(0, 8))) {
      return { text: directionDetailMessage(dir), parseMode: "HTML" };
    }
  }

  return null;
}
