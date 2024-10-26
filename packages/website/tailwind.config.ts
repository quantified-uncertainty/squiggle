import { createPreset } from "fumadocs-ui/tailwind-plugin";

import { getTailwindConfig } from "@quri/versioned-squiggle-components/tailwind";

export default getTailwindConfig({
  content: [
    "./src/**/*.{js,jsx,ts,tsx,md,mdx}",
    "./theme.config.jsx",
    "./node_modules/fumadocs-ui/dist/**/*.js",
  ],
  presets: [createPreset()],
  theme: {
    extend: {
      fontFamily: {
        lato: '"Lato", sans-serif',
        lora: '"Lora"',
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: "100%",
          },
        },
      },
    },
  },
});
