import { defineConfig } from "vitest/config";

import { versionDefines } from "./vite.config.js";

export default defineConfig({
  define: versionDefines,
  test: {
    root: import.meta.dirname,
    include: ["test/**/*.test.ts"],
    environment: "node",
  },
});
