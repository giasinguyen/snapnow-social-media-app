/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Instagram color palette
        'instagram-blue': '#0095F6',
        'instagram-light-blue': '#B2DFFC',
        'instagram-dark': '#262626',
        'instagram-gray': '#8E8E8E',
        'instagram-light-gray': '#FAFAFA',
        'instagram-border': '#DBDBDB',
      },
      fontFamily: {
        // Add custom fonts if needed
        'instagram': ['System'],
      },
    },
  },
  plugins: [],
}

