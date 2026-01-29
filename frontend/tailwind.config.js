/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#EF4444',
          dark: '#DC2626',
          light: '#F87171',
        },
        dark: {
          DEFAULT: '#1E293B',
          light: '#334155',
          lighter: '#475569',
        },
      },
    },
  },
  plugins: [],
}
