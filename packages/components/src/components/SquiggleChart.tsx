import * as React from "react";
import { useSquiggle, SquiggleArgs } from "../lib/hooks/useSquiggle";
import { SquiggleViewer, SquiggleViewerProps } from "./SquiggleViewer";
import { getValueToRender } from "../lib/utility";

type Props = SquiggleArgs & Omit<SquiggleViewerProps, "result">;

export const SquiggleChart: React.FC<Props> = React.memo((props) => {
  // TODO - split props into useSquiggle args and SquiggleViewer args would be cleaner
  // (but `useSquiggle` props are union-typed and are hard to extract for that reason)
  const resultAndBindings = useSquiggle(props);

  const valueToRender = getValueToRender(resultAndBindings);

  return <SquiggleViewer {...props} result={valueToRender} />;
});
