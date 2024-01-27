import { FC } from "react";

import { SquiggleEditor as OriginalSquiggleEditor } from "@quri/squiggle-components";

export const SquiggleEditor: FC<
  Parameters<typeof OriginalSquiggleEditor>[0]
> = (props) => (
  <div className="mt-6">
    <OriginalSquiggleEditor {...props} settings={{ chartHeight: 30 }} />
  </div>
);
