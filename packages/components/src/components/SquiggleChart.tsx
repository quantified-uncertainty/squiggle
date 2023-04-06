import * as React from "react";
import { useSquiggle, SquiggleArgs } from "../lib/hooks/useSquiggle.js";
import { SquiggleContainer } from "./SquiggleContainer.js";
import { SquiggleViewer, SquiggleViewerProps } from "./SquiggleViewer/index.js";
import { getValueToRender } from "../lib/utility.js";

type Props = SquiggleArgs & Omit<SquiggleViewerProps, "result">;

export const SquiggleChart: React.FC<Props> = React.memo((props) => {
  // TODO - split props into useSquiggle args and SquiggleViewer args would be cleaner
  // (but `useSquiggle` props are union-typed and are hard to extract for that reason)
  const resultAndBindings = useSquiggle(props);

  const valueToRender = getValueToRender(resultAndBindings);

  return (
    <SquiggleContainer>
      <SquiggleViewer {...props} result={valueToRender} />
    </SquiggleContainer>
  );
});
