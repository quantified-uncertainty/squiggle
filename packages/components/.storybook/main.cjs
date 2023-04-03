// import type { StorybookConfig } from "@storybook/core-common";

const config = {
  webpackFinal: async (config) => {
    const { default: custom } = await import("../webpack.config.js");
    config.resolve.alias = custom.resolve.alias;
    config.resolve.extensionAlias = custom.resolve.extensionAlias;
    return {
      ...config,
      module: {
        ...config.module,
        rules: [
          ...config.module.rules,
          custom.module.rules.find((x) => x.loader === "ts-loader"),
          {
            test: /\.(m?js)$/,
            type: "javascript/auto",
            resolve: {
              fullySpecified: false,
            },
          },
          // {
          //   test: /src\/styles\/main\.css$/,
          //   use: ["style-loader", "css-loader", "postcss-loader"],
          // },
        ],
      },
    };
  },
  stories: ["../src/**/*.stories.mdx", "../src/**/*.stories.@(js|jsx|ts|tsx)"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/preset-create-react-app",
  ],
  framework: "@storybook/react",
  core: {
    builder: {
      name: "webpack5",
      core: {
        options: {
          lazyCompilation: true,
          fsCache: true,
        },
      },
    },
  },
  typescript: {
    check: false,
    checkOptions: {},
    reactDocgen: "react-docgen-typescript",
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) =>
        prop.parent ? !/node_modules/.test(prop.parent.fileName) : true,
    },
  },
};

module.exports = config;
