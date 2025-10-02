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
  res.send(<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Кабинет клиента</title>
<script src="https://telegram.org/js/telegram-web-app.js"></script>
<style>
  :root{
    --bg:#0f1115; --text:#e9edf3; --muted:#aab3c2; --card:#161a22; --brand:#f37021; --ok:#21c97a; --line:rgba(255,255,255,.08)
  }
  *{box-sizing:border-box}
  html,body{margin:0;height:100%}
  body{background:var(--bg);color:var(--text);font:15px/1.5 system-ui,Segoe UI,Roboto,Arial}
  .wrap{max-width:920px;margin:0 auto;padding:16px 16px 28px}
  h1{margin:0 0 10px;font-size:22px}
  .muted{color:var(--muted)}
  .card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:14px;margin:12px 0}
  .row{display:flex;gap:8px;flex-wrap:wrap}
  .chip{padding:6px 10px;border-radius:999px;background:#0f1219;border:1px solid var(--line)}
  .chip.ok{background:rgba(33,201,122,.15);border-color:rgba(33,201,122,.35)}
  .btn{display:inline-block;background:var(--brand);color:#fff;text-decoration:none;border-radius:12px;padding:12px 16px;font-weight:700}
  .btn.ghost{background:transparent;color:var(--text);border:1px solid var(--line)}
  .grid{display:grid;gap:12px}
  @media(min-width:700px){.grid{grid-template-columns:1fr 1fr}}
</style>
</head>
<body>
  <div class="wrap">
    <h1>Кабинет клиента</h1>
    <div class="muted" id="hello">Здравствуйте!</div>

    <div class="grid">
      <div class="card">
        <h3>Шаги проекта</h3>
        <div class="row" id="steps">
          <span class="chip"   id="s1">Бриф</span>
          <span class="chip"   id="s2">Смета</span>
          <span class="chip"   id="s3">Концепции</span>
          <span class="chip"   id="s4">Продакшн</span>
          <span class="chip"   id="s5">Черновик</span>
          <span class="chip"   id="s6">Финал</span>
        </div>
        <p class="muted" id="status">Статус: жду бриф 📄</p>
      </div>

      <div class="card">
        <h3>Действия</h3>
        <p class="row">
          <a class="btn" href="/brief-template.docx">Скачать бриф (DOCX)</a>
          <button class="btn ghost" onclick="openChat()">Задать вопрос</button>
        </p>
        <p class="muted">Заполните файл и пришлите его обратно в чат боту.</p>
      </div>
    </div>

    <div class="card">
      <h3>Мои материалы</h3>
      <p class="muted">Здесь появятся смета, концепции и ссылки на ролики, когда менеджер их опубликует.</p>
      <div id="materials"></div>
    </div>
  </div>

<script>
  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.expand();
    const tp = tg.themeParams || {};
    // Нежно подхватываем тему Телеги
    const map = {
      '--bg': tp.bg_color,
      '--text': tp.text_color,
      '--muted': tp.hint_color,
      '--card': tp.secondary_bg_color,
      '--brand': tp.button_color
    };
    for (const k in map) if (map[k]) document.documentElement.style.setProperty(k, map[k]);
    const u = tg.initDataUnsafe?.user;
    if (u?.first_name) document.getElementById('hello').textContent = `Здравствуйте, ${u.first_name}!`;
  }
  function openChat(){ tg ? tg.close() : (location.href='https://t.me') }

  // Временный демо-статус (позже тут будет запрос к API)
  const STAGE_TEXT = {
    waiting_brief: "Жду бриф 📄",
    brief_received: "Бриф получен ✅. Считаем смету 💰",
    estimate_ready: "Смета готова 💼",
    estimate_approved: "Смета утверждена ✅",
    concepts_ready: "Концепции готовы 🎬"
  };
  // По умолчанию — «жду бриф»
  let stage = 'waiting_brief';
  document.getElementById('status').textContent = "Статус: " + STAGE_TEXT[stage];
  document.getElementById('s1').classList.add('ok'); // подсветим первый шаг
</script>
</body>
</html>
);
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
// /menu — открывает кабинет как WebApp прямо в Telegram
bot.command("menu", async (ctx) => {
  const kb = new Keyboard()
    .webApp("Открыть кабинет", "https://tg-prod-cabinet-production.up.railway.app/app")
    .resized();
  await ctx.reply("Меню:", { reply_markup: kb });
});

// запускаем поллинг бота
bot.start();

// --- Запуск сервера ---
app.listen(PORT, () => {
  console.log(`✅ Web server on http://localhost:${PORT}`);
  console.log("🤖 Bot polling started");
});
