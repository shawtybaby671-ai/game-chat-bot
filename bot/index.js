const { Telegraf } = require('telegraf');

const bot = new Telegraf('8133840763:AAGJIqn-TZZ8TrbTzbwF8NiyEGRPr22JxUs'); // Your token

let game = null;
const PAYOUT_WALLET = '@bingopays';
const ADMIN_USERNAME = 'degen_famous';

const balances = {};
const referrals = {}; // referrer -> { count, earned, hasGivenFirstBonus for each }
const referredBy = {}; // user -> referrer

let referralBonus = 2; // Default $2 — adjustable with admin command

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
bot.start((ctx) => {
  const user = ctx.from.username || ctx.from.first_name;
  ctx.reply(`Welcome to DegenFamous Bingo, @${user}!\nUse /newgame to start Lucky Lines.\nYour referral code: ${user}\nShare it — earn $${referralBonus} bonus when friends play!`);
});

bot.command('myreferral', (ctx) => {
  const user = ctx.from.username || ctx.from.first_name;
  const stats = referrals[user] || { referredCount: 0, bonusEarned: 0 };
  ctx.reply(`@${user} Referral Stats:\nCode: ${user}\nReferred: ${stats.referredCount}\nBonus Earned: $${stats.bonusEarned}\nCurrent bonus per referral: $${referralBonus}`);
});

bot.command('refer', (ctx) => {
  const code = ctx.message.text.split(' ')[1];
  if (!code) return ctx.reply('Usage: /refer <referral_code>');
  const user = ctx.from.username || ctx.from.first_name;
  if (referredBy[user]) return ctx.reply('You already have a referrer.');
  if (code.toLowerCase() === user.toLowerCase()) return ctx.reply('Can't refer yourself.');
  referredBy[user] = code;
  referrals[code] = referrals[code] || { referredCount: 0, bonusEarned: 0 };
  referrals[code].referredCount++;
  ctx.reply(`@${user} referred by ${code}! Welcome bonus activated.`);
});

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

  // Referral bonus on first buy
  const referrer = referredBy[user];
  if (referrer && !(referrals[referrer]?.givenBonusTo || {})[user]) {
    balances[referrer] = (balances[referrer] || 0) + referralBonus;
    referrals[referrer] = referrals[referrer] || { referredCount: 0, bonusEarned: 0 };
    referrals[referrer].bonusEarned += referralBonus;
    referrals[referrer].givenBonusTo = referrals[referrer].givenBonusTo || {};
    referrals[referrer].givenBonusTo[user] = true;
    ctx.reply(`@${user} bought Row ${rowId}!\nBonus: @${referrer} earned $${referralBonus} referral bonus!`);
  } else {
    ctx.reply(`@${user} bought Row ${rowId} for $${row.cost}!\nRemaining balance: $${balances[user]}`);
  }
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
bot.command('setreferbonus', adminOnly, (ctx) => {
  const amount = parseFloat(ctx.message.text.split(' ')[1]);
  if (isNaN(amount) || amount < 0) return ctx.reply('Usage: /setreferbonus <amount> (e.g., 5)');
  referralBonus = amount;
  ctx.reply(`Referral bonus set to $${amount} per active referral.`);
});

// Keep your other admin commands (forceboard, endgame, etc.)

bot.launch();
console.log('DegenFamous Bingo bot running with adjustable referral bonus...');
