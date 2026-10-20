import { defineConfig } from "vitest/config";

// The e2e suite (headless Chrome; see e2e/lib/harness.ts). Separate from
// vitest.config.ts so that `pnpm test` stays Chrome-free. Run it with
// `pnpm e2e`, which builds the client first.
export default defineConfig({
  test: {
    root: import.meta.dirname,
    include: ["e2e/**/*.e2e.test.ts"],
    environment: "node",
    // Scenario files take `expect` from e2e/lib/expect.ts, which uses the
    // global one under vitest (they also run outside vitest, in e2e:shoot).
    globals: true,
    // One Chrome, one scenario at a time: screenshots and timings stay stable.
    fileParallelism: false,
    testTimeout: 120_000,
    hookTimeout: 60_000,
  },
});
