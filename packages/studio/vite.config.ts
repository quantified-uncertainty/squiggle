import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: path.join(dirname, "src/client"),
  plugins: [react()],
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
