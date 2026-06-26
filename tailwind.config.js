/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0B0814',
        surface: '#161028',
        'surface-2': '#1E1638',
        'surface-3': '#271C49',
        border: '#34275f',
        'border-soft': '#241a42',
        'purple-deep': '#4C1D95',
        purple: '#7C3AED',
        'purple-bright': '#9D5CFF',
        neon: '#00FFA3',
        'neon-dim': '#00C883',
        red: '#FF4D6A',
        'red-dim': '#FF7A8F',
        'text-1': '#F1EDFB',
        'text-2': '#B3A8D6',
        'text-3': '#786B9E',
        gold: '#FFC857',
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow-purple': '0 4px 18px rgba(124,58,237,0.35)',
        'glow-neon': '0 4px 18px rgba(0,255,163,0.35)',
      },
      borderRadius: {
        lg2: '20px',
      },
    },
  },
  plugins: [],
};
