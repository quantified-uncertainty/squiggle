import { getTailwindConfig } from "@quri/versioned-squiggle-components/tailwind";

export default getTailwindConfig({
  content: ["./src/**/*.{js,jsx,ts,tsx,md,mdx}", "./theme.config.jsx"],
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
