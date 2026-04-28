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
        kavach: {
          bg: '#0a0e17',
          surface: '#111827',
          card: '#0f1629',
          border: 'rgba(255,255,255,0.08)',
          accent: '#00d4ff',
          'accent-green': '#10b981',
          'accent-red': '#ef4444',
          'accent-orange': '#f59e0b',
          'accent-purple': '#8b5cf6',
          text: '#e6edf3',
          muted: '#7d8590',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'flash-in': 'flashIn 0.6s ease-out',
        'pulse-dot': 'pulseDot 2s ease-in-out infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        flashIn: {
          '0%': { backgroundColor: 'rgba(0, 212, 255, 0.15)', transform: 'translateX(-4px)' },
          '100%': { backgroundColor: 'transparent', transform: 'translateX(0)' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(1.5)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
