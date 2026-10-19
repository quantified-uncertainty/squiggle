import type { StorybookConfig } from "@storybook/react-vite";
import { mergeConfig } from "vite";

const config: StorybookConfig = {
  stories: [
    {
      directory: "../src/stories",
      titlePrefix: "Relative Values",
      files: "**/*.stories.@(ts|tsx)",
    },
  ],
  addons: ["@storybook/addon-essentials"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  typescript: {
    check: false,
  },
  async viteFinal(config) {
    return mergeConfig(config, {
      // https://github.com/storybookjs/storybook/issues/22223
      build: { target: "esnext" },
      optimizeDeps: { esbuildOptions: { target: "esnext" } },
    });
  },
};

export default config;
