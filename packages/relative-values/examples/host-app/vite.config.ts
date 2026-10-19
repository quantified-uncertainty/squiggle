import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  // Don't pick up the PostCSS (Tailwind) config of the parent package in this
  // monorepo; the app has plain CSS.
  css: { postcss: { plugins: [] } },
  build: {
    // Squiggle ships modern syntax.
    target: "es2022",
    chunkSizeWarningLimit: 6000,
  },
  optimizeDeps: {
    esbuildOptions: { target: "es2022" },
  },
});
