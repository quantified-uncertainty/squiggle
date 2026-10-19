import { FC } from "react";

import { SquigglePlayground } from "@quri/squiggle-components";

import type { StudioView, StudioViewContext } from "./types.js";

export const SplitView: FC<{ context: StudioViewContext }> = ({ context }) => {
  return (
    <div className="h-full min-h-0">
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
