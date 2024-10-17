import { FC } from "react";

import { SquiggleEditor as OriginalSquiggleEditor } from "@quri/squiggle-components";

export const SquiggleEditor: FC<
  Parameters<typeof OriginalSquiggleEditor>[0]
> = (props) => (
  <div className="mt-6 rounded-md border border-gray-200 bg-white p-2">
    <OriginalSquiggleEditor {...props} chartHeight={30} />
  </div>
);
