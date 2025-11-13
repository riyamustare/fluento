/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        casino: ['Casino', 'sans-serif'],
        aeroport: ['Aeroport', 'sans-serif'],
      },
    },
  },
  plugins: [],
}