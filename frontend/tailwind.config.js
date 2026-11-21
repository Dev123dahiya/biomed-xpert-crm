/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Instrument Sans Variable"', '"Instrument Sans"', "system-ui", "sans-serif"],
      },
      colors: {
        ink: "var(--ink)",
        primary: "var(--primary)",
      },
      screens: { xs: "420px" },
    },
  },
  plugins: [],
};
