const { Telegraf } = require('telegraf');

const bot = new Telegraf('8133840763:AAGJIqn-TZZ8TrbTzbwF8NiyEGRPr22JxUs'); // Your token

let game = null;
let scheduledGame = null;
const PAYOUT_WALLET = '@bingopays';
const ADMIN_USERNAME = 'degen_famous'; // Your username without @

const balances = {};
const BOARD_VARIATIONS = [
  { costs: [1, 2, 1, 1, 2, 1, 2, 1, 1, 2, 1, 2, 1, 1, 2], payouts: [15, 20, 18, 15, 25, 16, 22, 15, 17, 20, 15, 23, 18, 15, 24] },
  { costs: [1, 1, 2, 1, 2, 1, 1, 2, 1, 2, 1, 2, 1, 2, 1], payouts: [15, 18, 20, 15, 23, 16, 19, 22, 15, 20, 17, 24, 15, 21, 18] },
];

function generateBoard(custom = null) {
  let rows = [];
  if (custom && custom.length === 15) {
    rows = custom;
  } else {
    const variation = BOARD_VARIATIONS[Math.floor(Math.random() * BOARD_VARIATIONS.length)];
    rows = variation.payouts.map((payout, i) => ({
      cost: variation.costs[i],
      payout,
    }));
  }

  const allNumbers = new Set();
  return rows.map((r, i) => {
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
      cost: r.cost,
      payout: r.payout,
      owner: null,
      numbers,
    };
  });
}

// Admin check
const adminOnly = (ctx, next) => {
  const username = ctx.from.username?.toLowerCase();
  if (username === ADMIN_USERNAME.toLowerCase()) {
    return next();
  }
  ctx.reply('Admin only command.');
};

// Public commands
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
  if (!game) return ctx.reply('No game in progress.');
  const board = game.rows.map(r => `Row ${r.id} (${r.owner || 'Available'}) - $${r.cost} / $${r.payout} - ${r.numbers.join(' ')}`).join('\n');
  ctx.reply(`Lucky Lines Flashboard:\n\n${board}`);
});

bot.command('balance', (ctx) => {
  const user = ctx.from.username || ctx.from.first_name;
  const bal = balances[user] || 0;
  ctx.reply(`@${user}, your balance: $${bal}`);
});

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

// CCTip detection
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

// Admin commands
bot.command('customboard', adminOnly, (ctx) => {
  const args = ctx.message.text.split(' ').slice(1);
  if (args.length !== 15) return ctx.reply('Usage: /customboard cost1/payout1 cost2/payout2 ... (15 rows)');
  const custom = args.map(arg => {
    const [cost, payout] = arg.split('/');
    return { cost: parseFloat(cost), payout: parseFloat(payout) };
  });
  game = { rows: generateBoard(custom), called: [] };
  const boardText = game.rows.map(r => `Row ${r.id}. $${r.cost} / $${r.payout}`).join('\n');
  ctx.reply(`Custom board set!\n\n${boardText}`);
});

bot.command('schedule', adminOnly, (ctx) => {
  const time = ctx.message.text.split(' ').slice(1).join(' ');
  if (!time) return ctx.reply('Usage: /schedule 20:00 or /schedule in 30m');
  scheduledGame = time;
  ctx.reply(`Game scheduled for ${time}. Will auto-start then.`);
});

bot.command('cancelschedule', adminOnly, (ctx) => {
  scheduledGame = null;
  ctx.reply('Scheduled game cancelled.');
});

bot.command('forcewin', adminOnly, (ctx) => {
  const rowId = parseInt(ctx.message.text.split(' ')[1]);
  if (!rowId || !game || !game.rows[rowId - 1]) return ctx.reply('Invalid row');
  const row = game.rows[rowId - 1];
  if (!row.owner) return ctx.reply('Row not owned');
  ctx.reply(`ADMIN FORCE WIN: @${row.owner} wins Row ${rowId} for $${row.payout}!`);
});

bot.command('resetbalances', adminOnly, (ctx) => {
  Object.keys(balances).forEach(k => delete balances[k]);
  ctx.reply('All player balances reset.');
});

bot.command('broadcast', adminOnly, (ctx) => {
  const message = ctx.message.text.split(' ').slice(1).join(' ');
  if (!message) return ctx.reply('Usage: /broadcast your message');
  ctx.reply(`Broadcast from admin: ${message}`);
});

bot.launch();
console.log('DegenFamous Bingo bot running with full admin commands for @degen_famous...');
