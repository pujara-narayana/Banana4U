/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './renderer/src/**/*.{js,jsx,ts,tsx}',
    './renderer/public/**/*.html',
  ],
  theme: {
    extend: {
      colors: {
        banana: {
          50: '#fffef0',
          100: '#fffbd1',
          200: '#fff7a3',
          300: '#ffef6a',
          400: '#ffe033',
          500: '#ffd60a',
          600: '#f0c000',
          700: '#c99700',
          800: '#a07600',
          900: '#7a5a00',
        },
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'pulse-glow': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'sway': 'sway 3s ease-in-out infinite',
      },
      keyframes: {
        sway: {
          '0%, 100%': { transform: 'rotate(-2deg)' },
          '50%': { transform: 'rotate(2deg)' },
        },
      },
    },
  },
  plugins: [],
};
