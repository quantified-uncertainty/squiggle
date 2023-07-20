import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx,md,mdx}",
    "../ui/src/**/*.{ts,tsx}",
    "../components/src/**/*.{ts,tsx}",
  ],
  plugins: [
    require("@quri/squiggle-components/tailwind-plugin"),
    require("@tailwindcss/forms")({
      strategy: "class", // strategy: 'base' interferes with react-select styles
    }),
  ],
} satisfies Config;
