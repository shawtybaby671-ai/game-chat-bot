const { Telegraf, Markup } = require('telegraf');
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const bot = new Telegraf('8133840763:AAGJIqn-TZZ8TrbTzbwF8NiyEGRPr22JxUs');

let game = null;
let flashboardMessage = null;
let callInterval = null;

const PAYOUT_WALLET = '@bingopays';
const ADMIN_USERNAME = 'degen_famous';

const balances = {};
const referrals = {};
const referredBy = {};

let referralBonus = 2;

// Board variations...
const BOARD_VARIATIONS = [
  { costs: [1, 2, 1, 1, 2, 1, 2, 1, 1, 2, 1, 2, 1, 1, 2], payouts: [15, 20, 18, 15, 25, 16, 22, 15, 17, 20, 15, 23, 18, 15, 24] },
  { costs: [1, 1, 2, 1, 2, 1, 1, 2, 1, 2, 1, 2, 1, 2, 1], payouts: [15, 18, 20, 15, 23, 16, 19, 22, 15, 20, 17, 24, 15, 21, 18] },
];

// generateBoard, getLetter, getNumberAudio, getCommentaryAudio, generateFlashboardImage functions same as before...

// Bingo ball image (must match called number)
function getBallImage(number) {
  const file = path.join(__dirname, 'balls', `${number}.png`);
  if (fs.existsSync(file)) return file;
  return path.join(__dirname, 'balls', 'default.png'); // fallback
}

// callNumber with ball image matching number
async function callNumber(ctx) {
  // ... same as before ...

  // Photorealistic ball image — matches exact called number
  const ballImage = getBallImage(calledNumber);
  await ctx.replyWithPhoto({ source: ballImage }, { caption: `${letter}-${calledNumber}!` });

  // ... rest of commentary, win, flashboard update ...
}

// /newgame with menu button
bot.command('newgame', async (ctx) => {
  game = {
    rows: generateBoard(),
    called: [],
  };
  const imagePath = generateFlashboardImage();
  const msg = await ctx.replyWithPhoto({ source: imagePath }, {
    caption: `New Lucky Lines game started!\nTip ${PAYOUT_WALLET} via CCTip to play.`,
    reply_markup: Markup.inlineKeyboard([
      [Markup.button.callback('Dashboard', 'dashboard')],
      [Markup.button.callback('Flashboard', 'refresh_board')],
    ]).reply_markup
  });
  flashboardMessage = msg;

  clearInterval(callInterval);
  callInterval = setInterval(() => callNumber(ctx), 4000);
});

// Menu button (persistent)
bot.command('menu', (ctx) => {
  ctx.reply('DegenFamous Bingo Menu', Markup.keyboard([
    ['/newgame', '/flashboard'],
    ['/balance', '/myreferral'],
    ['/dashboard', '/call']
  ]).resize());
});

// Dashboard portal
bot.command('dashboard', (ctx) => {
  const user = ctx.from.username || ctx.from.first_name;
  const bal = balances[user] || 0;
  const refs = referrals[user] || { referredCount: 0, bonusEarned: 0 };
  let status = 'No game in progress';
  if (game) {
    const filled = game.rows.filter(r => r.owner).length;
    status = `Game active — ${filled}/15 rows bought — Called: ${game.called.length}/75`;
  }
  ctx.replyWithHTML(
    `<b>DegenFamous Dashboard</b>\n\n` +
    `@${user}\n` +
    `Balance: $${bal}\n` +
    `Referrals: ${refs.referredCount} — Bonus Earned: $${refs.bonusEarned}\n\n` +
    `<b>Game Status:</b> ${status}\n\n` +
    `Use /menu for quick commands`,
    Markup.inlineKeyboard([
      [Markup.button.callback('Refresh Flashboard', 'refresh_board')],
      [Markup.button.callback('My Balance', 'my_balance')],
    ])
  );
});

// Inline button actions
bot.action('dashboard', (ctx) => ctx.answerCbQuery().then(() => bot.telegram.sendMessage(ctx.chat.id, 'Use /dashboard')));
bot.action('refresh_board', async (ctx) => {
  if (!game) return ctx.answerCbQuery('No game');
  const imagePath = generateFlashboardImage();
  await ctx.editMessageMedia({ type: 'photo', media: { source: imagePath } });
  ctx.answerCbQuery('Flashboard refreshed');
});
bot.action('my_balance', (ctx) => {
  const user = ctx.from.username || ctx.from.first_name;
  const bal = balances[user] || 0;
  ctx.answerCbQuery(`Your balance: $${bal}`);
});

// Set bot commands for dropdown (when typing /)
bot.telegram.setMyCommands([
  { command: 'newgame', description: 'Start a new Lucky Lines game' },
  { command: 'flashboard', description: 'View live flashboard' },
  { command: 'balance', description: 'Check your tip balance' },
  { command: 'buy', description: 'Buy a row (/buy <number>)' },
  { command: 'myreferral', description: 'Your referral code & stats' },
  { command: 'dashboard', description: 'Game dashboard & stats' },
  { command: 'menu', description: 'Show command menu' },
  { command: 'call', description: 'Call next number manually' },
]);

// Launch
bot.launch();
console.log('DegenFamous Bingo bot running with menu, dashboard, command dropdown, and synced ball visuals...');
