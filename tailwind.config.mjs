/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          150: '#e8edf3',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        blueGray: {
          50: '#f0f4f8',
          100: '#dae4ed',
          200: '#c4d4e2',
          300: '#a8bdd4',
          400: '#8ea7c7',
        },
      },
    },
  },
  plugins: [],
}

