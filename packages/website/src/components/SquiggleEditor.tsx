"use client";
import { FC } from "react";

import { SquiggleEditor as OriginalSquiggleEditor } from "@quri/squiggle-components";

/* FIXME: using this component with Fumadocs/Next.js/MDX is causing an internal error:
 *
 * > Internal error: Error: Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: undefined. You likely forgot to export your component from the file it's defined in, or you might have mixed up default and named imports.
 *
 * But the component renders correctly in the end, so I'm not sure what's going on.
 */
export const SquiggleEditor: FC<
  Parameters<typeof OriginalSquiggleEditor>[0]
> = (props) => (
  <div className="mt-6 rounded-md border border-gray-200 bg-white p-2">
    <OriginalSquiggleEditor {...props} chartHeight={30} />
  </div>
);
