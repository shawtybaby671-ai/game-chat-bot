import NeonButton from '@/components/NeonButton';
import LuckyLinesFlashboard from '@/components/LuckyLinesFlashboard';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center text-center px-8 bg-background">
      <h1 className="text-6xl md:text-8xl font-bold mb-12 text-neon-pink drop-shadow-lg">
        DegenFamous Bingo
      </h1>
      <h2 className="text-3xl md:text-5xl mb-8 text-neon-cyan">
        Lucky Lines
      </h2>
      <p className="text-xl md:text-2xl mb-16 text-neon-green max-w-2xl">
        Fast group chat bingo • Variable row payouts • Neon vibes • Free to play
      </p>
      <div className="space-x-8 mb-20">
        <NeonButton className="bg-neon-purple">
          Host Game
        </NeonButton>
        <NeonButton className="bg-neon-green">
          Join Group
        </NeonButton>
      </div>

      {/* Flashboard Preview */}
      <LuckyLinesFlashboard />
      
      <p className="mt-20 text-neon-cyan opacity-70 text-lg">
        Telegram bot integration coming soon — crypto tips optional
      </p>
    </main>
  );
}
