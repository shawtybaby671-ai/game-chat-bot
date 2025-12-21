// Updated bot/index.js with number calling every 4 seconds and live commentary

const { Telegraf } = require('telegraf');

const bot = new Telegraf('8133840763:AAGJIqn-TZZ8TrbTzbwF8NiyEGRPr22JxUs'); // Your token

let game = null;
let flashboardMessage = null;
let callInterval = null;

const PAYOUT_WALLET = '@bingopays';

const balances = {};

const BOARD_VARIATIONS = [
  { costs: [1, 2, 1, 1, 2, 1, 2, 1, 1, 2, 1, 2, 1, 1, 2], payouts: [15, 20, 18, 15, 25, 16, 22, 15, 17, 20, 15, 23, 18, 15, 24] },
  { costs: [1, 1, 2, 1, 2, 1, 1, 2, 1, 2, 1, 2, 1, 2, 1], payouts: [15, 18, 20, 15, 23, 16, 19, 22, 15, 20, 17, 24, 15, 21, 18] },
];

function generateBoard() {
  const variation = BOARD_VARIATIONS[Math.floor(Math.random() * BOARD_VARIATIONS.length)];
  const allNumbers = new Set();
  return variation.payouts.map((payout, i) => {
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
      marked: 0,
    };
  });
}

function getLetter(number) {
  return number <= 15 ? 'B' : number <= 30 ? 'I' : number <= 45 ? 'N' : number <= 60 ? 'G' : 'O';
}

async function callNumber(ctx) {
  if (!game || game.called.length >= 75) {
    clearInterval(callInterval);
    return ctx.reply('All numbers called — game over!');
  }

  const remaining = [];
  game.rows.forEach(r => {
    r.numbers.forEach(n => {
      if (!game.called.includes(n)) remaining.push({ number: n, row: r });
    });
  });

  if (remaining.length === 0) return;

  const pick = remaining[Math.floor(Math.random() * remaining.length)];
  const calledNumber = pick.number;
  const row = pick.row;

  game.called.push(calledNumber);
  row.marked++;

  const letter = getLetter(calledNumber);

  // Placeholder for audio and ball image (replace with real)
  await ctx.reply(`Calling ${letter}-${calledNumber}!`);

  // Commentary
  let commentary = '';
  if (row.owner) {
    if (row.marked === 1) commentary = `Welcome Row ${row.id} for @${row.owner}!`;
    else if (row.marked === 2) commentary = `Row ${row.id} has 2 down!`;
    else if (row.marked === 3) commentary = `Row ${row.id} has 3 down — halfway!`;
    else if (row.marked === 4) commentary = `Row ${row.id} is one away — hold on @${row.owner}!`;
    else if (row.marked === 5) commentary = `🎉 BINGO! Row ${row.id} wins for @${row.owner} — $${row.payout}! 🎉`;
  }

  if (commentary) await ctx.reply(commentary);

  // Win check
  if (row.marked === 5 && row.owner) {
    clearInterval(callInterval);
    await ctx.reply(`🎊 GAME OVER — @${row.owner} WINS $${row.payout}! 🎊`);
  }

  // Update flashboard
  await updateFlashboard(ctx);
}

async function updateFlashboard(ctx) {
  if (!flashboardMessage) return;
  const board = game.rows.map(r => {
    const status = r.owner ? `@${r.owner}` : 'Available';
    const numbers = r.numbers.map(n => game.called.includes(n) ? `**${n}**` : n).join(' ');
    return `Row ${r.id} (${status}) - $${r.cost} / $${r.payout} - ${numbers}`;
  }).join('\n');
  try {
    await bot.telegram.editMessageText(ctx.chat.id, flashboardMessage.message_id, null, `Lucky Lines Flashboard (Called: ${game.called.length}/75)\n\n${board}`, { parse_mode: 'Markdown' });
  } catch (e) {
    // Ignore
  }
}

bot.command('newgame', async (ctx) => {
  game = {
    rows: generateBoard(),
    called: [],
  };
  const boardText = game.rows.map(r => `Row ${r.id}. $${r.cost} / $${r.payout}`).join('\n');
  const msg = await ctx.reply(`New Lucky Lines game started!\n\n${boardText}\n\nTip ${PAYOUT_WALLET} via CCTip, then forward the success message here.`);
  flashboardMessage = msg;

  // Auto call every 4 seconds
  clearInterval(callInterval);
  callInterval = setInterval(() => callNumber(ctx), 4000);

  ctx.reply('Auto calling started — every 4 seconds with commentary!');
});

bot.command('stop', (ctx) => {
  clearInterval(callInterval);
  ctx.reply('Calling stopped.');
});

bot.command('call', (ctx) => callNumber(ctx));

// Keep your other commands (buy, balance, CCTip detection, admin)

bot.launch();
console.log('DegenFamous Bingo bot running with 4-second calling and player commentary...');
