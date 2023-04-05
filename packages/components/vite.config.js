import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

// via https://github.com/nuxt/vite/issues/160#issuecomment-983080874
const config = {
  resolve: {
    alias: {
      fs: require.resolve("rollup-plugin-node-builtins"),
    },
  },
};

export default config;
