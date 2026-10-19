import { FC, useCallback, useEffect, useRef, useState } from "react";

import { SquigglePlayground } from "@quri/squiggle-components";

import { useFocuser } from "../commands/focus.js";
import type { StudioView, StudioViewContext } from "./types.js";

export const SplitView: FC<{ context: StudioViewContext }> = ({ context }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  // The playground runs the code itself. It has run once its viewer shows a
  // result that isn't being recomputed (no dimmed "simulation #N" indicator).
  const [ran, setRan] = useState(false);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const check = () =>
      setRan(
        root.querySelector('[data-testid="dynamic-viewer-result"]') !== null &&
          root.querySelector(".whitespace-nowrap.text-zinc-200") === null
      );
    const observer = new MutationObserver(check);
    observer.observe(root, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["class"],
    });
    check();
    return () => observer.disconnect();
  }, []);

  // The view focuser (F6, ⌘2, ⌘1): the playground's editor.
  useFocuser(
    "view",
    useCallback(() => {
      const content =
        rootRef.current?.querySelector<HTMLElement>(".cm-content");
      if (!content) return false;
      content.focus();
      return true;
    }, [])
  );

  return (
    <div
      ref={rootRef}
      className="h-full min-h-0"
      // Ready once the playground has run and Studio's own run of the same
      // code is current (#25: render and agents wait for this marker).
      data-studio-ready={ran && !context.runOutput?.isStale ? "1" : "0"}
    >
      <SquigglePlayground
        // The playground's code is uncontrolled; remount on external changes.
        key={context.editorKey}
        defaultCode={context.code}
        sourceId={context.filePath}
        linker={context.linker}
        onCodeChange={context.setCode}
        onOpenExport={(sourceId) => {
          if (!sourceId.startsWith("hub:")) context.openFile(sourceId);
        }}
        height="100%"
      />
    </div>
  );
};

// The full Squiggle playground (its own editor, settings and viewer). The id is
// "split" for compatibility with saved state and `?view=split`.
export const splitView: StudioView = {
  id: "split",
  label: "Playground",
  hasOwnEditor: true,
  isAvailable: () => true,
  render: (context) => <SplitView context={context} />,
};
