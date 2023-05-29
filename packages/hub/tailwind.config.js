/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{tsx,ts}", "../../node_modules/@quri/ui/dist/**/*.js"],
  theme: {
    extend: {
      boxShadow: {
        dropdown: "rgba(0, 0, 0, 0.25) 0px 6px 16px",
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms")({
      strategy: "class", // strategy: 'base' interferes with react-select styles
    }),
  ],
};
