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
app.use(express.urlencoded({ extended: true })); 
// чтобы читать данные из <form>

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
// === Бриф ===
// Страница с формой
app.get("/brief", (_req, res) => {
  res.send(`<!doctype html>
<html lang="ru"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Заполнить бриф</title>
<style>
  :root{--brand:#f37021;--bg:#0f1115;--card:#161a22;--text:#e9edf3;--muted:#aab3c2}
  *{box-sizing:border-box} body{margin:0;background:var(--bg);color:var(--text);font:16px/1.5 system-ui,Segoe UI,Roboto,Arial}
  .wrap{max-width:780px;margin:0 auto;padding:24px}
  h1{margin:0 0 16px}
  form{background:var(--card);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:16px}
  label{display:block;margin:10px 0 6px;color:var(--muted)}
  input,textarea,select{width:100%;padding:10px;border-radius:10px;border:1px solid rgba(255,255,255,.12);background:#0f1219;color:#fff}
  textarea{min-height:120px}
  .row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .btn{margin-top:14px;display:inline-block;background:var(--brand);color:#fff;border:none;border-radius:12px;padding:12px 16px;font-weight:700;cursor:pointer}
  a{color:#8db7ff}
</style>
</head>
<body>
  <div class="wrap">
    <h1>Бриф на видео</h1>
    <form method="post" action="/brief">
      <label>Компания/бренд</label>
      <input name="company" placeholder="ООО «Ромашка»" required />

      <label>Цель ролика</label>
      <textarea name="goal" placeholder="Продажи, заявка, имидж, обучение..." required></textarea>

      <div class="row">
        <div>
          <label>Целевая аудитория</label>
          <input name="audience" placeholder="Кто? Возраст? Гео? Интересы?" />
        </div>
        <div>
          <label>Хронометраж (сек)</label>
          <input name="duration" type="number" min="5" max="600" placeholder="например, 30" />
        </div>
      </div>

      <label>Тональность/стиль</label>
      <input name="tone" placeholder="Серьёзно, с юмором, драйвово..." />

      <label>Референсы (ссылки)</label>
      <textarea name="refs" placeholder="https://youtu.be/...; https://vimeo.com/..."></textarea>

      <div class="row">
        <div>
          <label>Контактное лицо</label>
          <input name="contact" placeholder="Имя, должность" />
        </div>
        <div>
          <label>Телеграм/почта</label>
          <input name="contact_way" placeholder="@username или email" />
        </div>
      </div>

      <button class="btn" type="submit">Отправить бриф</button>
    </form>
    <p><a href="/app">← Вернуться в кабинет</a></p>
  </div>
</body></html>`);
});

// Приём формы
app.post("/brief", (req, res) => {
  // На этом этапе просто логируем — позже добавим БД
  console.log("📝 Новый бриф:", req.body);
  res.send(`<!doctype html><html lang="ru"><meta charset="utf-8"><body style="font:16px system-ui;background:#0f1115;color:#e9edf3">
  <div style="max-width:760px;margin:40px auto">
    <h1>Спасибо! Бриф получен ✅</h1>
    <p>Мы свяжемся с вами в ближайшее время.</p>
    <p><a href="/app" style="color:#8db7ff">Вернуться в кабинет</a></p>
  </div></body></html>`);
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
// команда /brief — присылаем ссылку на форму брифа (публичный домен)
bot.command("brief", (ctx) =>
  ctx.reply("Бриф: https://tg-prod-cabinet-production.up.railway.app/brief")
);

// запускаем поллинг бота
bot.start();

// --- Запуск сервера ---
app.listen(PORT, () => {
  console.log(`✅ Web server on http://localhost:${PORT}`);
  console.log("🤖 Bot polling started");
});
