import type { Config } from "tailwindcss";

export default {
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            maxWidth: "100%",
          },
        },
      },
    },
  },
  content: ["./src/**/*.{ts,tsx}", "../ui/src/**/*.{ts,tsx}"],
  plugins: [
    require("./src/tailwind-plugin.cts"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/forms"),
  ],
} satisfies Config;
