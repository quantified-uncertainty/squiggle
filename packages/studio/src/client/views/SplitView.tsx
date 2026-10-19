import { FC } from "react";

import { SquigglePlayground } from "@quri/squiggle-components";

import type { StudioViewContext } from "./types.js";

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
