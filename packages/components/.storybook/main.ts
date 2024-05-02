import type { StorybookConfig } from "@storybook/react-vite";
import { dirname, join } from "path";
import { mergeConfig } from "vite";

const config: StorybookConfig = {
  stories: [
    "../src/stories/**/*.mdx",
    // https://storybook.js.org/docs/react/configure/overview#with-a-configuration-object
    {
      directory: "../src/stories",
      titlePrefix: "Squiggle",
      files: "**/*.stories.@(js|jsx|ts|tsx)",
    },
  ],
  addons: [
    getAbsolutePath("@storybook/addon-docs"),
    getAbsolutePath("@storybook/addon-links"),
    getAbsolutePath("@storybook/addon-essentials"),
    {
      name: "@storybook/addon-styling",
      options: {
        postCss: true,
      },
    },
  ],
  framework: {
    name: getAbsolutePath("@storybook/react-vite"),
    options: {},
  },
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
    // Merge custom configuration into the default config
    return mergeConfig(config, {
      // https://github.com/storybookjs/storybook/issues/22223
      build: {
        target: "esnext",
      },
    });
  },
};

export default config;

function getAbsolutePath(value: string): any {
  return dirname(require.resolve(join(value, "package.json")));
}
