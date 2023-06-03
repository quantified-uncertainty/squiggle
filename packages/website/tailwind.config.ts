import type { Config } from "tailwindcss";

export default {
  content: ["../ui/src/**/*.{ts,tsx}", "../components/src/**/*.{ts,tsx}"],
  plugins: [
    require("@quri/squiggle-components/tailwind-plugin"),
    require("@tailwindcss/forms")({ strategy: "class" }),
  ],
  corePlugins: {
    // Tailwind's preflight will be injected by docusaurus plugin, see docusaurus.config.js
    preflight: false,
  },
} satisfies Config;
