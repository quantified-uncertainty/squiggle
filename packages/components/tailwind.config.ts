import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}", "../ui/src/**/*.{ts,tsx}"],
  plugins: [
    require("./src/tailwind-plugin.cts"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/forms"),
  ],
} satisfies Config;
