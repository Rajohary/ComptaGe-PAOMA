import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        surface: {
          primary: 'var(--color-surface-primary)',
          card: 'var(--color-surface-card)',
          secondary: 'var(--color-surface-secondary)',
        },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
        },
        border: {
          subtle: 'var(--color-border)',
        },
        brand: {
          DEFAULT: 'var(--color-brand)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
        },
        status: {
          success: 'var(--color-status-success)',
          alert: 'var(--color-status-alert)',
          info: 'var(--color-status-info)',
        },
      },
      fontFamily: {
        heading: ['Fraunces', 'serif'],
        sans: ['"Public Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
