import { FC } from "react";

import { focusMain, focusNextPart } from "./focus.js";
import { useCommand } from "./registry.js";

// F6 / ⇧F6 (the way out of CodeMirror's Tab trap) and squiggle.focusMain
// (Esc in the Explorer). Renders nothing.
export const CoreCommands: FC = () => {
  useCommand("workbench.action.focusNextPart", () =>
    focusNextPart(1).then(() => undefined)
  );
  useCommand("workbench.action.focusPreviousPart", () =>
    focusNextPart(-1).then(() => undefined)
  );
  // With no file shown, focus stays where it is.
  useCommand("squiggle.focusMain", () => focusMain().then(() => undefined));
  return null;
};
