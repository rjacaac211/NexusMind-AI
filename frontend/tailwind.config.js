/** @type {import('tailwindcss').Config} */
export default {
  // Scan all relevant files:
  content: ["./src/**/*.{js,jsx,ts,tsx}"],

  // Enable dark mode via a .dark class on a parent container
  darkMode: "class",

  theme: {
    extend: {
      fontFamily: {
        // Now whenever you use "font-sans", it’ll apply Inter first
        sans: ["Inter", "ui-sans-serif", "system-ui"],
      },
      // You can also customize your colors, spacing, etc. here
    },
  },
  plugins: [],
};
