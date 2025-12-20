import { useState } from 'react';

const ROWS = 15;
const NUMBERS_PER_ROW = 5;

 // Example fixed rows (in real game, generated once per game)
const exampleRows = Array.from({ length: ROWS }, (_, i) => ({
  id: i + 1,
  name: i < 3 ? 'Cheap Thrill' : i < 7 ? 'Standard' : i < 10 ? 'High Roller' : i < 13 ? 'Moonshot' : i === 13 ? 'Golden Row' : 'Free Row',
  cost: i < 3 ? 'Free / 0.5' : i < 7 ? '1.0' : i < 10 ? '2.0' : i < 13 ? '3.0' : i === 13 ? '5.0' : 'Free',
  payout: i < 3 ? '1.5x' : i < 7 ? '3x' : i < 10 ? '8x' : i < 13 ? '15x' : i === 13 ? '25x + Jackpot' : 'Shared 1x',
  numbers: Array.from({ length: NUMBERS_PER_ROW }, () => Math.floor(Math.random() * 75) + 1),
  marked: [] as number[],
}));

export default function LuckyLinesFlashboard() {
  const [rows, setRows] = useState(exampleRows);
  const [calledNumbers, setCalledNumbers] = useState<number[]>([]);

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h2 className="text-4xl font-bold text-neon-cyan mb-8 text-center">
        Lucky Lines Flashboard
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {rows.map((row) => (
          <div key={row.id} className="bg-black/50 border-4 border-neon-purple rounded-xl p-6 shadow-2xl">
            <div className="flex justify-between mb-4">
              <h3 className="text-2xl font-bold text-neon-pink">{row.name} (Row {row.id})</h3>
              <div className="text-right">
                <p className="text-neon-green">Cost: {row.cost}</p>
                <p className="text-neon-cyan">Payout: {row.payout}</p>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-4">
              {row.numbers.map((num, idx) => (
                <div
                  key={idx}
                  className={`aspect-square flex items-center justify-center text-3xl font-bold rounded-lg ${
                    calledNumbers.includes(num)
                      ? 'bg-neon-green text-black'
                      : 'bg-black/70 text-neon-pink border-2 border-neon-cyan'
                  }`}
                >
                  {num}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
