import type { StorybookConfig } from "@storybook/react-vite";
import { mergeConfig } from "vite";

const config: StorybookConfig = {
  stories: [
    "../src/stories/**/*.mdx",
    {
      directory: "../src/stories",
      titlePrefix: "UI",
      files: "**/*.stories.@(js|jsx|ts|tsx)",
    },
  ],
  addons: ["@storybook/addon-essentials"],
  framework: "@storybook/react-vite",
  typescript: {
    check: false,
    reactDocgen: "react-docgen-typescript",
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) =>
        prop.parent ? !/node_modules/.test(prop.parent.fileName) : true,
    },
  },
  docs: {
    autodocs: true,
  },
  async viteFinal(config) {
    // Match the components Storybook target for the updated esbuild compiler.
    return mergeConfig(config, {
      build: {
        target: "esnext",
      },
    });
  },
};

export default config;
