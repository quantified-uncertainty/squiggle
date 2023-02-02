//const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const custom = require("../webpack.config.js");

module.exports = {
  webpackFinal: async (config) => {
    config.resolve.alias = custom.resolve.alias;
    return {
      ...config,
      experiments: custom.experiments,
      plugins: custom.plugins.concat(config.plugins),
      module: {
        ...config.module,
        rules: config.module.rules.concat(
          custom.module.rules.filter((x) => x.loader === "ts-loader")
        ),
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
    builder: "webpack5",
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
