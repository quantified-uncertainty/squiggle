import { createRequire } from "node:module";
import topLevelAwait from "vite-plugin-top-level-await";

const require = createRequire(import.meta.url);

// via https://github.com/nuxt/vite/issues/160#issuecomment-983080874
const config = {
  resolve: {
    alias: {
      fs: require.resolve("rollup-plugin-node-builtins"),
    },
  },
  plugins: [
    topLevelAwait({
      // The export name of top-level await promise for each chunk module
      promiseExportName: "__tla",
      // The function to generate import names of top-level await promise in each chunk module
      promiseImportName: (i) => `__tla_${i}`,
    }),
  ],
};

export default config;
