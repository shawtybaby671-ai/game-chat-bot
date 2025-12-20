const { Telegraf, Markup } = require('telegraf');
const bot = new Telegraf('8133840763:AAGJIqn-TZZ8TrbTzbwF8NiyEGRPr22JxUs'); // Your token

let game = null;
let pollMessage = null;

const STYLES = {
  low: { minCost: 1, maxCost: 2, minPayout: 15, maxPayout: 25 },
  medium: { minCost: 3, maxCost: 10, minPayout: 30, maxPayout: 100 },
  high: { minCost: 10, maxCost: 20, minPayout: 100, maxPayout: 200 },
  juiced: { minCost: 1, maxCost: 20, minPayout: 20, maxPayout: 200 },
};

function generateBoard(style) {
  const { minCost, maxCost, minPayout, maxPayout } = STYLES[style];
  const rows = [];
  let totalCost = 0;
  for (let i = 1; i <= 15; i++) {
    const cost = Math.floor(Math.random() * (maxCost - minCost + 1)) + minCost;
    let payout = Math.floor(cost * (9 + Math.random() * 6)); // 9–15x base
    payout = Math.min(payout, maxPayout);
    rows.push({ id: i, cost, payout });
    totalCost += cost;
  }
  // Cap max payout to totalCost - 1
  const maxAllowed = totalCost - 1;
  rows.forEach(r => r.payout = Math.min(r.payout, maxAllowed));
  return { rows, totalCost };
}

bot.start((ctx) => ctx.reply('Welcome to DegenFamous Bingo! Use /newgame to start Lucky Lines with player poll for style.'));

bot.command('newgame', async (ctx) => {
  const poll = await ctx.replyWithPoll(
    'Vote for the prize range/style for this game!',
    ['Low Stakes ($15–$25)', 'Medium Stakes ($30–$100)', 'High Stakes ($100–$200)', 'Juiced Special (up to $200)'],
    { is_anonymous: false, allows_multiple_answers: false }
  );
  pollMessage = poll.message_id;

  // Wait 2 minutes for votes
  setTimeout(async () => {
    const results = await ctx.telegram.getPollResults(poll.chat.id, poll.message_id);
    const votes = results.options.map(o => o.voter_count);
    const maxVotes = Math.max(...votes);
    const winningIndex = votes.indexOf(maxVotes);
    const styles = ['low', 'medium', 'high', 'juiced'];
    const chosenStyle = styles[winningIndex] || 'low'; // default low

    const { rows, totalCost } = generateBoard(chosenStyle);
    game = { rows, called: [], chosenStyle };

    const boardText = rows.map(r => `Row ${r.id}. $${r.cost} / $${r.payout}`).join('\n');
    ctx.reply(`Poll ended! Winning style: ${results.options[winningIndex].text}\n\nNew Lucky Lines game started!\nTotal to fill: $${totalCost}\n\n${boardText}\n\nUse /buy <row#> to reserve (pay via forwarded tip)`);
  }, 120000); // 2 minutes
});

bot.command('flashboard', (ctx) => {
  if (!game) return ctx.reply('No game in progress.');
  const board = game.rows.map(r => `Row ${r.id} (${r.owner || 'Available'}) - $${r.cost} / $${r.payout} - Numbers: ${r.numbers?.join(' ') || 'Pending'}`).join('\n');
  ctx.reply(`Lucky Lines Flashboard (${game.chosenStyle} style):\n\n${board}`);
});

// Add /buy logic, number calling, win detection, @cctip recognition as before

bot.launch();
console.log('Bot is running with player poll for style and auto variations...');
