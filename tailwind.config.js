/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fdf2f2',
          100: '#fde8e8',
          200: '#fbd5d5',
          300: '#f8b4b4',
          400: '#f98080',
          500: '#e74c3c',
          600: '#c0392b',
          700: '#8B1A1A',
          800: '#6B1515',
          900: '#4A0E0E',
          950: '#2D0808',
        },
        gold: {
          50: '#fdf8e8',
          100: '#fcefc4',
          200: '#f9e08b',
          300: '#f5ca48',
          400: '#D4A843',
          500: '#C9A84F',
          600: '#a68a2e',
          700: '#7d6822',
          800: '#685520',
          900: '#59471f',
        },
        surface: {
          50: '#f8f9fa',
          100: '#f1f3f5',
          200: '#e9ecef',
          300: '#dee2e6',
          400: '#ced4da',
          500: '#adb5bd',
          600: '#868e96',
          700: '#495057',
          800: '#343a40',
          900: '#212529',
        },
        dark: {
          bg: '#0B0D13',
          card: '#12151E',
          elevated: '#1A1D2B',
          border: '#252838',
          hover: '#2A2D40',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif'],
        gujarati: ['Noto Sans Gujarati', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      boxShadow: {
        'glow': '0 0 20px rgba(231, 76, 60, 0.3)',
        'glow-gold': '0 0 20px rgba(212, 168, 67, 0.3)',
        'card': '0 4px 30px rgba(0, 0, 0, 0.1)',
        'card-dark': '0 4px 30px rgba(0, 0, 0, 0.4)',
      },
    },
  },
  plugins: [],
};
