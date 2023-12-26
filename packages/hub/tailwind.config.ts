import type { Config } from "tailwindcss";

import { getVersionedTailwindContent } from "@quri/versioned-squiggle-components/tailwind";

export default {
  content: [
    "./src/**/*.{ts,tsx}",
    "../ui/src/**/*.{ts,tsx}",
    "../components/src/**/*.{ts,tsx}",
    ...getVersionedTailwindContent(),
  ],
  theme: {
    extend: {
      boxShadow: {
        dropdown: "rgba(0, 0, 0, 0.25) 0px 6px 16px",
      },
    },
  },
  plugins: [
    require("@quri/squiggle-components/tailwind-plugin"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/forms")({
      strategy: "class", // strategy: 'base' interferes with react-select styles
    }),
  ],
} satisfies Config;
