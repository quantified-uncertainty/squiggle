/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{tsx,ts}"],
  important: ".squiggle-relative-values",
  theme: {
    extend: {
      boxShadow: {
        dropdown: "rgba(0, 0, 0, 0.25) 0px 6px 16px",
      },
    },
  },
  plugins: [],
};
