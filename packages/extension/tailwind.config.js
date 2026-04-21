/** @type {import('tailwindcss').Config} */
export default {
  content: ['./entrypoints/**/*.{html,ts,tsx}', './node_modules/streamdown/dist/*.js'],
  theme: {
    extend: {},
  },
  plugins: [require('@tailwindcss/typography')],
}
