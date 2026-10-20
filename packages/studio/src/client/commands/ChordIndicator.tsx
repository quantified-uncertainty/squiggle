import { FC, useSyncExternalStore } from "react";

import { formatKey } from "../../shared/commands/index.js";
import { TID } from "../../shared/testIds.js";
import { host } from "../lib/host.js";
import { getPendingChord, subscribeChord } from "./dispatcher.js";

// "⌘K was pressed. Waiting for second key…", bottom-left above the status
// bar, while a chord is pending (§4.6 step 3).
export const ChordIndicator: FC = () => {
  const chord = useSyncExternalStore(
    subscribeChord,
    getPendingChord,
    getPendingChord
  );
  if (chord === null) return null;
  return (
    <div
      data-testid={TID.chordIndicator}
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed bottom-8 left-2 z-50 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700 shadow-md"
    >
      <kbd className="font-sans font-semibold">
        {formatKey(chord, host.platform)}
      </kbd>{" "}
      was pressed. Waiting for second key…
    </div>
  );
};
