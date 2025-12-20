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
      <div className="space-x-6">
        <button className="px-10 py-5 bg-neon-purple rounded-xl text-2xl font-bold hover:scale-110 transition-transform shadow-lg">
          Host Game
        </button>
        <button className="px-10 py-5 bg-neon-green rounded-xl text-2xl font-bold hover:scale-110 transition-transform shadow-lg">
          Join Group
        </button>
      </div>
      <p className="mt-20 text-neon-cyan opacity-70 text-lg">
        Telegram bot coming soon — crypto tips optional
      </p>
    </main>
  );
}
