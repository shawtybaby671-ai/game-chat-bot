const { Telegraf } = require('telegraf');
const { createCanvas } = require('canvas');
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
  { costs: [2, 1, 1, 2, 1, 2, 1, 1, 2, 1, 2, 1, 2, 1, 1], payouts: [20, 15, 18, 22, 15, 24, 16, 15, 20, 17, 23, 15, 20, 18, 15] },
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

function getNumberAudio(number) {
  const letter = getLetter(number);
  const file = path.join(__dirname, 'audio', `${letter}${number}.ogg`);
  if (fs.existsSync(file)) return file;
  return null; // fallback to text
}

function getCommentaryAudio(type) {
  const file = path.join(__dirname, 'audio', `${type}.ogg`);
  if (fs.existsSync(file)) return file;
  return null;
}

function getBallImage(number) {
  const file = path.join(__dirname, 'balls', `${number}.png`);
  if (fs.existsSync(file)) return file;
  return path.join(__dirname, 'balls', 'default.png');
}

function generateFlashboardImage() {
  const width = 900;
  const height = 1400;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Dark background
  ctx.fillStyle = '#0A001F';
  ctx.fillRect(0, 0, width, height);

  // Title
  ctx.font = 'bold 70px Arial';
  ctx.fillStyle = '#FF00FF';
  ctx.textAlign = 'center';
  ctx.fillText('DEGENFAMOUS BINGO', width / 2, 100);
  ctx.font = 'bold 50px Arial';
  ctx.fillStyle = '#00FFFF';
  ctx.fillText('Lucky Lines', width / 2, 170);

  // Rows
  game.rows.forEach((row, i) => {
    const y = 250 + i * 80;
    ctx.font = '35px Arial';
    ctx.fillStyle = row.owner ? '#00FF9D' : '#FFFFFF';
    ctx.textAlign = 'left';
    ctx.fillText(`Row ${row.id} (${row.owner || 'Available'})`, 50, y);
    ctx.fillStyle = '#FF69B4';
    ctx.fillText(`$${row.cost} / $${row.payout}`, 400, y);

    // Numbers
    row.numbers.forEach((num, j) => {
      const x = 50 + j * 150;
      ctx.font = 'bold 50px Arial';
      ctx.fillStyle = game.called.includes(num) ? '#FFFF00' : '#00FFFF';
      ctx.strokeStyle = '#FF00FF';
      ctx.lineWidth = 4;
      ctx.strokeText(num, x + 600, y);
      ctx.fillText(num, x + 600, y);
    });
  });

  const buffer = canvas.toBuffer('image/png');
  const filePath = path.join(__dirname, 'flashboard.png');
  fs.writeFileSync(filePath, buffer);
  return filePath;
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

  // Audio number call
  const numberAudio = getNumberAudio(calledNumber);
  if (numberAudio) await ctx.replyWithVoice({ source: numberAudio });

  // Photorealistic ball
  const ballImage = getBallImage(calledNumber);
  await ctx.replyWithPhoto({ source: ballImage }, { caption: `${letter}-${calledNumber}!` });

  // Commentary
  let commentaryType = '';
  let commentaryText = '';
  if (row.owner) {
    if (row.marked === 1) { commentaryType = 'welcome'; commentaryText = `Welcome Row ${row.id} for @${row.owner}!`; }
    else if (row.marked === 2) { commentaryType = 'double'; commentaryText = `Row ${row.id} has 2 down!`; }
    else if (row.marked === 3) { commentaryType = 'halfway'; commentaryText = `Row ${row.id} is halfway there!`; }
    else if (row.marked === 4) { commentaryType = 'oneaway'; commentaryText = `Row ${row.id} is one away — don't choke @${row.owner}!`; }
    else if (row.marked === 5) { commentaryType = 'bingo'; commentaryText = `🎉 BINGO! Row ${row.id} wins for @${row.owner} — $${row.payout}! 🎉`; }
  }

  if (commentaryType) {
    const commentaryAudio = getCommentaryAudio(commentaryType);
    if (commentaryAudio) await ctx.replyWithVoice({ source: commentaryAudio });
    await ctx.reply(commentaryText);
  }

  // Win
  if (row.marked === 5 && row.owner) {
    clearInterval(callInterval);
    await ctx.reply(`🎊 GAME OVER — @${row.owner} WINS $${row.payout}! 🎊`);
  }

  // Update live flashboard image
  const imagePath = generateFlashboardImage();
  if (flashboardMessage) {
    try {
      await bot.telegram.editMessageMedia(ctx.chat.id, flashboardMessage.message_id, null, { type: 'photo', media: { source: imagePath } });
    } catch (e) {
      const msg = await ctx.replyWithPhoto({ source: imagePath });
      flashboardMessage = msg;
    }
  }
}

bot.command('newgame', async (ctx) => {
  game = {
    rows: generateBoard(),
    called: [],
  };
  const imagePath = generateFlashboardImage();
  const msg = await ctx.replyWithPhoto({ source: imagePath }, { caption: `New Lucky Lines game started!\nTip ${PAYOUT_WALLET} via CCTip to play.` });
  flashboardMessage = msg;

  clearInterval(callInterval);
  callInterval = setInterval(() => callNumber(ctx), 4000);

  ctx.reply('Auto calling started — every 4 seconds with audio, commentary, balls, and live flashboard!');
});

bot.command('stop', (ctx) => {
  clearInterval(callInterval);
  ctx.reply('Calling stopped.');
});

bot.command('call', (ctx) => callNumber(ctx));

// Your other commands (buy, balance, CCTip detection, admin commands)

bot.launch();
console.log('DegenFamous Bingo bot running with audio, photorealistic balls, commentary, and live flashboard...');
