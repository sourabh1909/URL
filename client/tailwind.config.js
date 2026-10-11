/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        nordic: {
          bg: '#F8FAFC',
          surface: '#FFFFFF',
          pine: '#244A42',
          'pine-light': '#2F6156',
          mist: '#DCE7ED',
          sage: '#A8B9A5',
          'sage-light': '#C5D4C3',
          charcoal: '#263238',
          slate: '#64748B',
          border: '#E2E8F0',
          // Dark mode counterparts
          'dark-bg': '#0B111A',
          'dark-surface': '#151F2E',
          'dark-border': '#223249',
          'dark-text': '#E2E8F0',
          'dark-muted': '#8E9FA8',
          'dark-pine': '#3A7D6F',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.75rem',
        'nordic': '0.875rem',
        'nordic-lg': '1rem',
      },
    },
  },
  plugins: [],
};
