const { Telegraf } = require('telegraf');
const express = require('express');
const fs = require('fs');
const path = require('path');

const bot = new Telegraf('8133840763:AAGJIqn-TZZ8TrbTzbwF8NiyEGRPr22JxUs'); // Your token

let game = null;
let flashboardMessage = null;
let callInterval = null;

const PAYOUT_WALLET = '@bingopays';
const ADMIN_USERNAME = 'degen_famous';

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
  // Same as before — calling, commentary, win detection, update flashboard
}

// Your other functions (getNumberAudio, getCommentaryAudio, generateFlashboardImage, updateFlashboard, etc.)

bot.command('newgame', async (ctx) => {
  game = {
    rows: generateBoard(),
    called: [],
  };
  const boardText = game.rows.map(r => `Row ${r.id}. $${r.cost} / $${r.payout}`).join('\n');
  ctx.reply(`New Lucky Lines game started!\n\n${boardText}\n\nTip ${PAYOUT_WALLET} via CCTip to play.\n\nView live dashboard: http://localhost:3000/dashboard`);
  clearInterval(callInterval);
  callInterval = setInterval(() => callNumber(ctx), 4000);
  ctx.reply('Auto calling started!');
});

// ... other bot commands (buy, balance, etc.)

bot.launch();
console.log('DegenFamous Bingo bot running...');

// Integrate web dashboard with Express
const app = express();
const port = 3000;

app.get('/dashboard', (req, res) => {
  if (!game) {
    res.send('<h1>No game in progress</h1><p>Use /newgame in the bot to start one.</p>');
    return;
  }

  const html = `
    <h1>DegenFamous Bingo Dashboard</h1>
    <p>Called numbers: ${game.called.join(', ') || 'None yet'}</p>
    <table border="1">
      <tr>
        <th>Row</th>
        <th>Owner</th>
        <th>Cost/Payout</th>
        <th>Numbers</th>
        <th>Marked</th>
      </tr>
      ${game.rows.map(r => `
        <tr>
          <td>${r.id}</td>
          <td>${r.owner || 'Available'}</td>
          <td>$${r.cost} / $${r.payout}</td>
          <td>${r.numbers.map(n => game.called.includes(n) ? `<b>${n}</b>` : n).join(' ')}</td>
          <td>${r.marked}/5</td>
        </tr>
      `).join('')}
    </table>
  `;
  res.send(html);
});

app.listen(port, () => {
  console.log(`Web dashboard running at http://localhost:${port}/dashboard`);
});
