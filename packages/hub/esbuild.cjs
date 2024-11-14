const esbuild = require("esbuild");

for (const name of [
  "buildRecentModelRevision/worker",
  "buildRecentModelRevision/main",
  "print-schema",
]) {
  esbuild.buildSync({
    entryPoints: [`./src/scripts/${name}.ts`],
    platform: "node",
    format: "esm",
    sourcemap: true,
    minify: true,
    bundle: true,
    // via https://github.com/evanw/esbuild/pull/2067#issuecomment-1073039746
    banner: {
      js: `
await (async () => {
  const { dirname } = await import("path");
  const { fileURLToPath } = await import("url");

  /**
   * Shim entry-point related paths.
   */
  if (typeof globalThis.__filename === "undefined") {
    globalThis.__filename = fileURLToPath(import.meta.url);
  }
  if (typeof globalThis.__dirname === "undefined") {
    globalThis.__dirname = dirname(globalThis.__filename);
  }
  /**
   * Shim require if needed.
   */
  if (typeof globalThis.require === "undefined") {
    const { default: module } = await import("module");
    globalThis.require = module.createRequire(import.meta.url);
  }
})();
`,
    },
    outfile: `./dist/scripts/${name}.mjs`,
    external: ["server-only"],
  });
}
