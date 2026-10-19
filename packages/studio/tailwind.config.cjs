/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("node:path");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    path.join(__dirname, "src/client/**/*.{ts,tsx,html}"),
    path.join(__dirname, "node_modules/@quri/ui/dist/**/*.js"),
    path.join(__dirname, "node_modules/@quri/squiggle-components/dist/**/*.js"),
  ],
  plugins: [
    require("@tailwindcss/forms")({ strategy: "class" }),
    require("@quri/squiggle-components/tailwind-plugin"),
  ],
};
