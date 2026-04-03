/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'game-bg': '#0f172a',
        'game-card': '#1e293b',
        'game-border': '#334155',
        'game-purple': '#8b5cf6',
        'game-cyan': '#06b6d4',
        'game-green': '#22c55e',
        'game-yellow': '#eab308',
        'game-red': '#ef4444',
      },
      fontFamily: {
        'game': ['Orbitron', 'monospace'],
      }
    },
  },
  plugins: [],
}
