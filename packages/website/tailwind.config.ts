import type { Config } from "tailwindcss";

export default {
  content: ["../ui/src/**/*.{ts,tsx}", "../components/src/**/*.{ts,tsx}"],
  plugins: [
    require("@quri/squiggle-components/tailwind-plugin"),
    // I'm not sure if this is necessary - we already add scoped-forms.css, because it needs to be wrapped in .squiggle
    require("@tailwindcss/forms")({ strategy: "class" }),
  ],
  corePlugins: {
    // Scoped Tailwind's preflight will be inserted manually
    preflight: false,
  },
  important: ".squiggle",
} satisfies Config;
