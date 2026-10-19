import { defineConfig } from "vitest/config";

// Unit tests for the main-process code, with the `electron` module mocked
// (no Electron binary needed). tsconfig.json compiles only src/, so tests
// never reach dist/.
export default defineConfig({
  test: {
    root: import.meta.dirname,
    include: ["test/**/*.test.ts"],
    environment: "node",
  },
});
