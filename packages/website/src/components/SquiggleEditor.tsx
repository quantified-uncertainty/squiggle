import { SquiggleEditor as OriginalSquiggleEditor } from "@quri/squiggle-components";
import { FC } from "react";

export const SquiggleEditor: FC<
  Parameters<typeof OriginalSquiggleEditor>[0]
> = (props) => (
  <div className="mt-6">
    <OriginalSquiggleEditor {...props} chartHeight={30} />
  </div>
);
