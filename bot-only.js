import dotenv from "dotenv";
dotenv.config();

import { Bot } from "grammy";

const token = process.env.TELEGRAM_TOKEN;
if (!token) {
  console.error("⛔ В .env нет TELEGRAM_TOKEN");
  process.exit(1);
}

const bot = new Bot(token);

bot.command("start", (ctx) => ctx.reply(`Привет, ${ctx.from.first_name || "друг"}! Я на связи ✅`));
bot.command("ping",  (ctx) => ctx.reply("pong ✅"));

bot.on("message", (ctx) => console.log("📩", ctx.from.id, "-", ctx.message.text || ""));

console.log("🤖 Bot polling started (bot-only)");
bot.start();
