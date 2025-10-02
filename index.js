import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { Bot, Keyboard } from "grammy";

const PORT = process.env.PORT || 3000;
const token = process.env.TELEGRAM_TOKEN;

if (!token) {
  console.error("⛔ В .env нет TELEGRAM_TOKEN");
  process.exit(1);
}

// --- Express (простой сервер для проверок) ---
const app = express();
app.use(express.urlencoded({ extended: true })); // читаем данные из <form>


app.get("/", (_req, res) => res.send("Сервер жив ✅"));
app.get("/health", (_req, res) => res.json({ ok: true, t: Date.now() }));
// страница "Кабинет" по адресу /app
app.get("/app", (_req, res) => {
  res.send(`<!doctype html>
<html lang="ru"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Кабинет клиента</title>
<style>
  :root{--brand:#f37021;--bg:#0f1115;--card:#161a22;--text:#e9edf3;--muted:#aab3c2}
  *{box-sizing:border-box} body{margin:0;background:var(--bg);color:var(--text);
  font:16px/1.5 Montserrat,system-ui,Segoe UI,Roboto,Arial,sans-serif}
  .wrap{max-width:900px;margin:0 auto;padding:24px}
  h1{margin:0 0 16px}
  .card{background:var(--card);border:1px solid rgba(255,255,255,.08);
    border-radius:16px;padding:16px;margin:12px 0}
  .row{display:flex;gap:10px;flex-wrap:wrap}
  .badge{display:inline-block;padding:4px 10px;border-radius:999px;
    background:rgba(243,112,33,.18);color:var(--brand);font-weight:700}
  .btn{display:inline-block;background:var(--brand);color:#fff;text-decoration:none;
    border-radius:12px;padding:10px 14px;font-weight:700;margin-top:8px}
  small{color:var(--muted)}
</style>
</head>
<body>
  <div class="wrap">
    <h1>Кабинет клиента</h1>
    <div class="card">
      <h3>Мой проект</h3>
      <div class="row">
        <span class="badge">ТЗ</span>
        <span class="badge">Идеи</span>
        <span class="badge">Сценарий</span>
        <span class="badge">Черновик</span>
        <span class="badge">Финал</span>
      </div>
      <a class="btn" href="#">Заполнить ТЗ (скоро)</a>
      <p><small>Это MVP-страница. Позже подменим на полноценный интерфейс.</small></p>
    </div>
  </div>
</body></html>`);
});
// страница БРИФА (GET /brief)
app.get("/brief", (_req, res) => {
  res.send(`<!doctype html><html lang="ru"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Бриф</title></head>
<body style="font:16px system-ui;max-width:760px;margin:40px auto;line-height:1.5">
  <h1>Бриф на видео</h1>
  <form method="post" action="/brief">
    <p><label>Компания/бренд<br><input name="company" required style="width:100%;padding:8px"></label></p>
    <p><label>Цель ролика<br><textarea name="goal" required style="width:100%;height:120px;padding:8px"></textarea></label></p>
    <p><label>Целевая аудитория<br><input name="audience" style="width:100%;padding:8px"></label></p>
    <p><label>Референсы (ссылки)<br><textarea name="refs" style="width:100%;height:80px;padding:8px"></textarea></label></p>
    <p><button type="submit" style="padding:10px 14px;font-weight:700">Отправить бриф</button></p>
  </form>
  <p><a href="/app">← Вернуться в кабинет</a></p>
</body></html>`);
});

// приём формы (POST /brief)
app.post("/brief", async (req, res) => {
  console.log("📝 Новый бриф:", req.body); 
   // уведомление менеджеру в Telegram (если указан chat_id)
  const managerId = process.env.MANAGER_CHAT_ID;
  if (managerId) {
    const b = req.body || {};
    const msg =
      `<b>Новый бриф</b>\n` +
      `Компания: ${b.company || "-"}\n` +
      `Цель: ${b.goal || "-"}\n` +
      `ЦА: ${b.audience || "-"}\n` +
      `Рефы: ${b.refs || "-"}\n` +
      `Контакт: ${b.contact || "-"}; ${b.contact_way || "-"}`;

    try {
      await bot.api.sendMessage(Number(managerId), msg, { parse_mode: "HTML" });
    } catch (e) {
      console.error("❌ Не удалось отправить уведомление менеджеру:", e.message);
    }
  }

  res.send(`<!doctype html><meta charset="utf-8">
  <body style="font:16px system-ui;max-width:760px;margin:40px auto">
    <h1>Спасибо! Бриф получен ✅</h1>
    <p><a href="/app">Вернуться в кабинет</a></p>
  </body>`);
});

// --- Telegram Bot ---
const bot = new Bot(token);

bot.command("start", async (ctx) => {
  const kb = new Keyboard().text("Открыть кабинет (позже)").resized();
  await ctx.reply(`Привет, ${ctx.from.first_name || "друг"}! Я на связи ✅`, { reply_markup: kb });
});

bot.command("ping", (ctx) => ctx.reply("pong ✅"));
bot.on("message", (ctx) => console.log("📩", ctx.from.id, "-", ctx.message.text || ""));

// по кнопке "Открыть кабинет (позже)" — шлём ссылку
bot.hears("Открыть кабинет (позже)", (ctx) => {
  ctx.reply("Кабинет: http://localhost:3000/");
});

// запасной вариант: команда /open делает то же самое
bot.command("open", (ctx) => ctx.reply("Кабинет: http://localhost:3000/"));
// команда /app — присылаем ссылку на кабинет
bot.command("app", (ctx) => ctx.reply("Кабинет: http://localhost:3000/app"));

// команда /menu — показывает кнопку, которая откроет кабинет внутри Телеги
bot.command("menu", async (ctx) => {
  const kb = new Keyboard()
    .webApp("Открыть кабинет", "http://localhost:3000/app")
    .resized();
  await ctx.reply("Меню:", { reply_markup: kb });
});
// команда /brief — присылаем ссылку на форму
bot.command("brief", (ctx) =>
  ctx.reply("Бриф: https://tg-prod-cabinet-production.up.railway.app/brief")
);
// покажу твой chat_id, чтобы настроить уведомления
bot.command("myid", (ctx) => ctx.reply(`Ваш chat_id: ${ctx.chat.id}`));
// /notifytest — проверка, что бот может писать менеджеру
bot.command("notifytest", async (ctx) => {
  try {
    await bot.api.sendMessage(Number(process.env.MANAGER_CHAT_ID || 0),
      `Тест-уведомление ✅ от ${ctx.from.id}`);
    await ctx.reply("Отправил уведомление менеджеру ✅");
  } catch (e) {
    await ctx.reply("Не смог отправить уведомление: " + e.message);
    console.error("notifytest error:", e);
  }
});
// /notifytest — гарантированный тест уведомлений менеджеру
bot.command("notifytest", async (ctx) => {
  console.log("🔔 /notifytest from", ctx.from.id);
  try {
    await ctx.reply("Команда принята, шлём уведомление…");
    await bot.api.sendMessage(
      Number(process.env.MANAGER_CHAT_ID || 0),
      `Тест-уведомление ✅ от ${ctx.from.id}`
    );
  } catch (e) {
    console.error("notifytest error:", e);
    await ctx.reply("Не получилось отправить уведомление: " + e.message);
  }
});

// Подстраховка: если по какой-то причине .command не срабатывает
bot.hears(/^\/notifytest\b/i, async (ctx) => {
  console.log("🔔 hears /notifytest from", ctx.from.id);
  try {
    await ctx.reply("Команда принята (hears), шлём уведомление…");
    await bot.api.sendMessage(
      Number(process.env.MANAGER_CHAT_ID || 0),
      `Тест-уведомление ✅ (hears) от ${ctx.from.id}`
    );
  } catch (e) {
    console.error("notifytest-hears error:", e);
  }
});

// запускаем поллинг бота
bot.start();

// --- Запуск сервера ---
app.listen(PORT, () => {
  console.log(`✅ Web server on http://localhost:${PORT}`);
  console.log("🤖 Bot polling started");
});
