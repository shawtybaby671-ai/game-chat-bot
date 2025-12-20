const { Telegraf } = require('telegraf');
const bot = new Telegraf('YOUR_BOT_TOKEN_HERE'); // Replace with your @BotFather token

// Simple in-memory game state (for demo; use Supabase later)
let game = null;

// Example 15 rows with variable costs/payouts
const ROWS = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1,
  name: i < 3 ? 'Cheap Thrill' : i < 7 ? 'Standard' : i < 10 ? 'High Roller' : i < 13 ? 'Moonshot' : i === 13 ? 'Golden Row' : 'Free Row',
  cost: i < 3 ? 'Free / 0.5 USDT' : i < 7 ? '1.0 USDT' : i < 10 ? '2.0 USDT' : i < 13 ? '3.0 USDT' : i === 13 ? '5.0 USDT' : 'Free',
  payout: i < 3 ? '1.5x' : i < 7 ? '3x' : i < 10 ? '8x' : i < 13 ? '15x' : i === 13 ? '25x + Jackpot' : 'Shared 1x',
  numbers: Array.from({ length: 5 }, () => Math.floor(Math.random() * 75) + 1).sort((a, b) => a - b),
  owner: null,
}));

bot.start((ctx) => ctx.reply('Welcome to DegenFamous Bingo! Use /newgame to start Lucky Lines.'));

bot.command('newgame', (ctx) => {
  game = { rows: ROWS.map(r => ({ ...r, owner: null })), called: [], pot: 0 };
  const board = game.rows.map(r => `Row ${r.id} - ${r.name} - Cost: ${r.cost} - Payout: ${r.payout}`).join('\n');
  ctx.reply(`New Lucky Lines game started!\n\n${board}\n\nUse /buy <row#> to reserve a row`);
});

bot.command('flashboard', (ctx) => {
  if (!game) return ctx.reply('No game in progress. Use /newgame');
  const board = game.rows.map(r => `Row ${r.id} (${r.owner || 'Available'}) - ${r.numbers.join(' ')}`).join('\n');
  ctx.reply(`Lucky Lines Flashboard:\n\n${board}`);
});

bot.command('buy', (ctx) => {
  if (!game) return ctx.reply('No game in progress.');
  const rowId = parseInt(ctx.message.text.split(' ')[1]);
  const row = game.rows.find(r => r.id === rowId);
  if (!row || row.owner) return ctx.reply('Invalid or taken row.');
  row.owner = ctx.from.username || ctx.from.first_name;
  ctx.reply(`You reserved Row ${rowId}! Good luck.`);
});

bot.launch();

console.log('Bot is running...');
