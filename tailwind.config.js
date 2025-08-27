// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  // Update this to include all files with Tailwind classes
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#dc2626',
        background: '#0f172a',
        surface: '#1e293b',
        foreground: '#f8fafc',
        muted: '#94a3b8',
        border: '#334155',
      },
    },
  },
  plugins: [],
};
