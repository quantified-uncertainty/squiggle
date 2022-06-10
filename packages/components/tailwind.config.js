module.exports = {
  content: ["./src/**/*.{html,tsx,ts,js,jsx}"],
  theme: {
    extend: {},
  },
  important: ".squiggle",
  plugins: [require("@tailwindcss/forms")],
};
