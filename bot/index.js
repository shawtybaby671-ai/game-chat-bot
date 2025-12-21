const { Telegraf } = require('telegraf');

const bot = new Telegraf('8133840763:AAGJIqn-TZZ8TrbTzbwF8NiyEGRPr22JxUs'); // Your token

let game = null;
const PAYOUT_WALLET = '@bingopays'; // Wallet holder for tips

// In-memory balances (player username → amount credited)
const balances = {};

// Board variations (add more arrays for rotation)
const BOARD_VARIATIONS = [
  { costs: [1, 2, 1, 1, 2, 1, 2, 1, 1, 2, 1, 2, 1, 1, 2], payouts: [15, 20, 18, 15, 25, 16, 22, 15, 17, 20, 15, 23, 18, 15, 24] },
  { costs: [1, 1, 2, 1, 2, 1, 1, 2, 1, 2, 1, 2, 1, 2, 1], payouts: [15, 18, 20, 15, 23, 16, 19, 22, 15, 20, 17, 24, 15, 21, 18] },
  // Add more variations here for auto-rotation
];

// Generate a random board
function generateBoard() {
  const variation = BOARD_VARIATIONS[Math.floor(Math.random() * BOARD_VARIATIONS.length)];
  const allNumbers = new Set();
  const rows = variation.payouts.map((payout, i) => {
    const numbers = [];
    while (numbers.length < 5) {
      const num = Math.floor(Math.random() * 75) + 1;
      if (!allNumbers.has(num)) {
        numbers.push(num);
        allNumbers.add(num);
      }
    }
    numbers.sort((a, b) => a - b);
    return {
      id: i + 1,
      cost: variation.costs[i],
      payout,
      owner: null,
      numbers,
    };
  });
  return rows;
}

bot.start((ctx) => ctx.reply('Welcome to DegenFamous Bingo! Use /newgame to start Lucky Lines.'));

bot.command('newgame', (ctx) => {
  game = {
    rows: generateBoard(),
    called: [],
  };
  const boardText = game.rows.map(r => `Row ${r.id}. $${r.cost} / $${r.payout}`).join('\n');
  ctx.reply(`New Lucky Lines game started!\n\n${boardText}\n\nTip ${PAYOUT_WALLET} via CCTip, then forward the success message here to get credited.\nUse /balance to check your tip balance.`);
});

bot.command('flashboard', (ctx) => {
  if (!game) return ctx.reply('No game in progress. Use /newgame');
  const board = game.rows.map(r => `Row ${r.id} (${r.owner || 'Available'}) - $${r.cost} / $${r.payout} - ${r.numbers.join(' ')}`).join('\n');
  ctx.reply(`Lucky Lines Flashboard:\n\n${board}`);
});

// CCTip detection on forwarded messages
bot.on('message', (ctx) => {
  if (!game) return;
  const msg = ctx.message;
  if (msg.forward_from && msg.forward_from.username === 'cctip_bot') {
    const text = (msg.text || msg.caption || '').toLowerCase();
    if (text.includes('sent') && text.includes('usdt') && text.includes(PAYOUT_WALLET.toLowerCase())) {
      const amountMatch = text.match(/([\d.]+)\s*usdt/i);
      if (amountMatch) {
        const amount = parseFloat(amountMatch[1]);
        const user = ctx.from.username || ctx.from.first_name;
        balances[user] = (balances[user] || 0) + amount;
        ctx.reply(`@${user}, $${amount} USDT tip confirmed!\nYour balance: $${balances[user]}\nUse /buy <row#> to reserve rows.`);
      }
    }
  }
});

// /balance command
bot.command('balance', (ctx) => {
  const user = ctx.from.username || ctx.from.first_name;
  const bal = balances[user] || 0;
  ctx.reply(`@${user}, your balance: $${bal}`);
});

// /buy command
bot.command('buy', (ctx) => {
  if (!game) return ctx.reply('No game in progress.');
  const rowId = parseInt(ctx.message.text.split(' ')[1]);
  if (!rowId || rowId < 1 || rowId > 15) return ctx.reply('Invalid row. Use /buy <1-15>');
  const row = game.rows[rowId - 1];
  if (row.owner) return ctx.reply('Row already taken.');
  const user = ctx.from.username || ctx.from.first_name;
  const bal = balances[user] || 0;
  if (bal < row.cost) return ctx.reply(`Not enough balance. Row costs $${row.cost}, you have $${bal}.`);
  balances[user] -= row.cost;
  row.owner = user;
  ctx.reply(`@${user} bought Row ${rowId} for $${row.cost}!\nRemaining balance: $${balances[user]}`);
});

bot.launch();
console.log('DegenFamous Bingo bot running...');
