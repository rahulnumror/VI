/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#1E40AF',       // Deep Royal Blue
          'blue-hover': '#1D4ED8',
          'blue-light': '#EFF6FF',
          'blue-border': '#BFDBFE',
          yellow: '#D97706',     // Dark Yellow / Deep Amber
          'yellow-dark': '#B45309',
          'yellow-light': '#FEF3C7',
          'yellow-border': '#FDE68A',
        },
        primary: {
          DEFAULT: '#1E40AF',
          dark: '#1E3A8A',
          light: '#EFF6FF',
        },
        accent: {
          yellow: '#D97706',
          'yellow-dark': '#B45309',
          'yellow-light': '#FEF3C7',
        },
        slate: {
          canvas: '#F8FAFC',
          surface: '#FFFFFF',
          border: '#E2E8F0',
        },
        critical: {
          red: '#EF4444',
          light: '#FEE2E2',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'card-hover': '0 4px 6px -1px rgba(30, 64, 175, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
}
