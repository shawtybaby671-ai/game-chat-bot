import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./App/**/*.{js,ts,jsx,tsx}",  // App Router pages and components
    "./components/**/*.{js,ts,jsx,tsx}", // Reusable components (we'll add this folder later)
  ],
  theme: {
    extend: {
      colors: {
        background: '#0A001F', // Deep cosmic purple-black
        neon: {
          pink: '#FF00FF',
          cyan: '#00FFFF',
          purple: '#9D00FF',
          green: '#00FF9D',
        },
        tropical: {
          palm: '#0F5132',
          sunset: '#FF6B35',
        },
      },
      fontFamily: {
        display: ['"Press Start 2P"', 'cursive'], // Optional retro arcade font
      },
    },
  },
  plugins: [],
};

export default config;
