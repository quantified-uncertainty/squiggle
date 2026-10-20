import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const dirname = path.dirname(fileURLToPath(import.meta.url));

function packageVersion(file: string): string {
  const json: unknown = JSON.parse(fs.readFileSync(file, "utf-8"));
  if (
    typeof json === "object" &&
    json !== null &&
    "version" in json &&
    typeof json.version === "string"
  ) {
    return json.version;
  }
  throw new Error(`No version in ${file}`);
}

// Shown by Help ▸ About (src/client/globals.d.ts declares them).
export const versionDefines = {
  __STUDIO_VERSION__: JSON.stringify(
    packageVersion(path.join(dirname, "package.json"))
  ),
  __SQUIGGLE_LANG_VERSION__: JSON.stringify(
    packageVersion(path.join(dirname, "../squiggle-lang/package.json"))
  ),
};

export default defineConfig({
  root: path.join(dirname, "src/client"),
  plugins: [react()],
  define: versionDefines,
  css: {
    postcss: path.join(dirname, "postcss.config.cjs"),
  },
  build: {
    outDir: path.join(dirname, "dist/client"),
    emptyOutDir: true,
    target: "es2022",
    chunkSizeWarningLimit: 6000,
  },
  // Squiggle and CodeMirror ship modern syntax; don't downlevel it.
  optimizeDeps: {
    esbuildOptions: { target: "es2022" },
  },
  esbuild: { target: "es2022" },
  worker: {
    format: "es",
  },
});
