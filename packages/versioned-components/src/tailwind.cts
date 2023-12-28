import tailwindForms from "@tailwindcss/forms";
import tailwindTypography from "@tailwindcss/typography";
import { glob } from "glob";
import merge from "lodash/merge.js";
import fs from "node:fs";
import path from "node:path";
import type { Config } from "tailwindcss";

import tailwindSquiggle from "@quri/squiggle-components/tailwind-plugin";

// Generated paths will be absolute and fully symlink-resolved.
function getVersionedSquiggleContent() {
  // relative to this file; this file will be located in `./dist/src/tailwind.js`
  const srcGlobs = [
    "../../../../node_modules/.pnpm/@quri+ui@*/node_modules/@quri/ui/src",
    "../../node_modules/squiggle-components-*/src",
    "../../../ui/src",
    "../../../components/src",
  ];

  const resolvedGlobs = srcGlobs.map((dir) => path.resolve(__dirname, dir));

  // This is necessary because of this bug: https://github.com/vercel/next.js/issues/50388
  const dirs = resolvedGlobs.map((globDir) => glob.sync(globDir)).flat();

  const extraContent = dirs.map((dir) =>
    path.join(fs.realpathSync(dir), "/**/*.{js,jsx,ts,tsx,md,mdx}")
  );

  return extraContent;
}

export function getTailwindConfig(partialConfig: Config) {
  return merge(
    {
      content: getVersionedSquiggleContent(),
      plugins: [
        tailwindSquiggle,
        tailwindTypography,
        tailwindForms({
          strategy: "class", // strategy: 'base' interferes with react-select styles
        }),
      ],
    } satisfies Config,
    partialConfig
  );
}
