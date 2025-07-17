/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bgPage: '#0d1117',
        bgPanel: '#161b22',
        fgBase: '#c9d1d9',
        fgMuted: '#8b949e',
        accent: '#58a6ff',
        neon: '#58ffc8',
      },
      boxShadow: {
        neon: '0 0 8px #58a6ff',
      },
    },
  },
  plugins: [],
};
