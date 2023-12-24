import { glob } from "glob";
import fs from "node:fs";
import path from "node:path";

// Generated paths will be absolute and fully symlink-resolved.
export function getVersionedTailwindContent() {
  // relative to this package's root; this file will be located in `./dist/src/tailwind.js`
  const srcGlobs = [
    "../../../../node_modules/.pnpm/@quri+ui@*/node_modules/@quri/ui/src",
    "../../node_modules/squiggle-components-*/src",
  ];

  const resolvedGlobs = srcGlobs.map((dir) => path.resolve(__dirname, dir));

  // This is necessary because of this bug: https://github.com/vercel/next.js/issues/50388
  const dirs = resolvedGlobs.map((globDir) => glob.sync(globDir)).flat();

  const extraContent = dirs.map((dir) =>
    path.join(fs.realpathSync(dir), "/**/*.{js,jsx,ts,tsx,md,mdx}")
  );

  return extraContent;
}
