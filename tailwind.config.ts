/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'ui-sans-serif', 'system-ui'],
        mono: ['"JetBrains Mono"', 'ui-monospace'],
      },
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#dce6ff',
          200: '#baceff',
          300: '#8aacff',
          400: '#527eff',
          500: '#2f5bff',
          600: '#1a3df5',
          700: '#1530e0',
          800: '#1828b5',
          900: '#1a288f',
          950: '#111960',
        },
        surface: {
          0:   '#ffffff',
          50:  '#f8f9fc',
          100: '#f0f2f8',
          200: '#e3e7f0',
          300: '#c8cfe3',
          800: '#1e2235',
          900: '#141828',
          950: '#0d1020',
        },
      },
      keyframes: {
        'slide-up': {
          '0%':   { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',   opacity: '1' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'pop-in': {
          '0%':   { transform: 'scale(0.92)', opacity: '0' },
          '100%': { transform: 'scale(1)',    opacity: '1' },
        },
        'typing-dot': {
          '0%, 60%, 100%': { transform: 'translateY(0)' },
          '30%':            { transform: 'translateY(-4px)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.4' },
        },
      },
      animation: {
        'slide-up':    'slide-up 0.18s ease-out',
        'fade-in':     'fade-in 0.15s ease-out',
        'pop-in':      'pop-in 0.2s cubic-bezier(0.34,1.56,0.64,1)',
        'typing-1':    'typing-dot 1.2s ease-in-out 0s infinite',
        'typing-2':    'typing-dot 1.2s ease-in-out 0.2s infinite',
        'typing-3':    'typing-dot 1.2s ease-in-out 0.4s infinite',
        'pulse-soft':  'pulse-soft 2s ease-in-out infinite',
      },
      boxShadow: {
        'bubble': '0 1px 2px rgba(0,0,0,0.08)',
        'panel':  '0 4px 24px rgba(0,0,0,0.06)',
        'modal':  '0 8px 40px rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
}