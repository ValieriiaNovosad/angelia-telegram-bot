# Telegram-бот — Медичний центр «Ангелія»

Бот для пацієнтів клініки: довідкова інформація, лікарі, прайс, запис на прийом, нагадування, підтвердження візиту, повідомлення адміну. Опційно — Google Meet через Google Calendar.

**Стек:** Node.js, TypeScript, [grammY](https://grammy.dev/)

## Можливості

| Функція | Опис |
|--------|------|
| ℹ️ Інформація | Графік роботи, адреса, телефон, як дістатися |
| 🤖 24/7 | Бот відповідає цілодобово; адміністратор — у години роботи клініки |
| 👨‍⚕️ Лікарі | Список, спеціальність, години прийому, кабінет |
| 💰 Прайс | Послуги та ціни (редагується в `data/services.json`) |
| 📅 Запис | Лікар → дата (за графіком) → слоти часу → офлайн/онлайн → ім'я → телефон |
| 🔔 Нагадування | За 24 год (налаштовується) + кнопки підтвердження/скасування |
| 💬 Адміну | Повідомлення пересилається в Telegram адміністраторам |
| 🔗 Google Meet | При онлайн-записі (потрібен Google Calendar API) |

## Швидкий старт

### 1. Створіть бота

1. Напишіть [@BotFather](https://t.me/BotFather) → `/newbot`
2. Скопіюйте токен

### 2. Налаштування

```bash
cd angelia-telegram-bot
cp .env.example .env
# Відредагуйте .env — BOT_TOKEN, ADMIN_CHAT_IDS
```

Свій Telegram ID: [@userinfobot](https://t.me/userinfobot)

### 3. Дані клініки

Відредагуйте файли (без перезбірки коду):

- `data/clinic.json` — адреса, телефон, графік, маршрут
- `data/doctors.json` — лікарі та їхні години
- `data/services.json` — прайс

### 4. Запуск

```bash
npm install
npm run dev
```

У Telegram: `/start`

## Команди

- `/start` — головне меню
- `/help` — довідка
- `/info` — контакти та графік
- `/doctors` — лікарі
- `/price` — прайс
- `/book` — запис
- `/my` — мої записи

**Адміністратор** (ваш ID у `ADMIN_CHAT_IDS`):

- `/appointments` — записи «очікує»
- `/confirm 5` — підтвердити запис №5
- `/cancel 5` — скасувати запис №5
- `/remind 5` — надіслати демо-нагадування пацієнту зараз

## Google Meet (опційно)

Потрібен **Google Workspace** і Calendar API:

1. [Google Cloud Console](https://console.cloud.google.com/) → увімкніть **Google Calendar API**
2. Створіть **Service Account**, завантажте JSON-ключ
3. Надайте сервісному акаунту доступ до календаря клініки (або використайте domain-wide delegation)
4. У `.env`:

```env
GOOGLE_CALENDAR_ENABLED=true
GOOGLE_APPLICATION_CREDENTIALS=./google-service-account.json
GOOGLE_CALENDAR_ID=your-calendar@group.calendar.google.com
```

Без цього онлайн-записи зберігаються без посилання Meet.

## Структура проєкту

```
src/
  index.ts          — точка входу
  bot.ts            — ініціалізація grammY
  config.ts         — env + JSON-дані
  conversations/    — діалоги запису та повідомлень
  handlers/         — команди та кнопки
  db/               — SQLite записи
  services/         — нагадування, адмін, Google Meet
data/               — клініка, лікарі, прайс
```

## Ліцензія

MIT — навчальний проєкт для медичного центру «Ангелія».
