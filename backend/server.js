const { Telegraf } = require('telegraf');
const express = require('express');

const BOT_TOKEN = process.env.BOT_TOKEN;
const bot = new Telegraf(BOT_TOKEN);
const app = express();
app.use(express.json());

const games = {}; // {chatId: {mode: 'standard'|'lucky'|'tournament', called: Set, rows: {}, timer, pattern}}
const users = {}; // {userId: {points: 0, sweeps: 0, gold: 0, referrals: [], xp: 0}}
const records = [];
const referrals = {}; // {code: userId}

bot.command('refer', (ctx) => {
  const code = ctx.from.id.toString().slice(-6);
  referrals[code] = ctx.from.id;
  ctx.reply(`Your referral code: ${code} – Share for XP bonuses!`);
});

bot.command('buyrow', (ctx) => ctx.reply('Tip 0.1 USDT to @cctip_bot, forward confirmation here for a row!'));

bot.on('message', async (ctx) => {
  if (ctx.message.forward_from?.username === 'cctip_bot' && ctx.message.text.includes('USDT')) {
    // Simple tip validation – enhance with regex for amount
    const userId = ctx.from.id;
    users[userId] = users[userId] || {points: 0};
    users[userId].points += 1; // 1 row per tip
    ctx.reply(`Row credited! You have ${users[userId].points} rows.`);
  }
});

bot.command('startgame', (ctx) => {
  const chatId = ctx.chat.id.toString();
  games[chatId] = {called: new Set(), rows: {}, pattern: 'line'}; // Add pattern selection later
  games[chatId].timer = setInterval(() => callNumber(ctx, chatId), 30000);
  ctx.reply('Game on! Buy rows or launch Mini App.');
});

function callNumber(ctx, chatId) {
  // Same as before + themed commentary
  const num = /* random */;
  ctx.reply(`🌌 Cosmic call: ${num}! Near wins loading...`);
}

// Claims, tournaments, validation expanded similarly...

app.get('/api/leaderboard', (req, res) => { /* Top by wins/XP */ res.json(/*...*/); });

const PORT = process.env.PORT || 3000;
app.use(bot.webhookCallback('/webhook'));
bot.launch();
app.listen(PORT);