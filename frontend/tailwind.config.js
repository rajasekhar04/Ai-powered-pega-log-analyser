/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Saudi Arabia theme colors
        'saudi-green': '#006C35',
        'royal-gold': '#FFD700',
        'clean-white': '#FFFFFF',
        'light-green': '#E8F5E8',
        'dark-green': '#004A24',
      },
    },
  },
}
