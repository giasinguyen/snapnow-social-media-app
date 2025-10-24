/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        'instagram-blue': '#0095F6',
        'instagram-light-blue': '#B2DFFC',
        'instagram-dark': '#262626',
        'instagram-gray': '#8E8E8E',
        'instagram-light-gray': '#FAFAFA',
        'instagram-border': '#DBDBDB',
      },
      fontFamily: { instagram: ['System'] },
    },
  },
  plugins: [],
}
