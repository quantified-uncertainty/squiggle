import { memo } from "react";

import { useSquiggle } from "../../lib/hooks/index.js";
import { PartialPlaygroundSettings } from "../PlaygroundSettings.js";
import { SquiggleErrorAlert } from "../SquiggleErrorAlert.js";
import { ExpressionViewer } from "./ExpressionViewer.js";
import { ViewerProvider } from "./ViewerProvider.js";

export type SquiggleViewerProps = {
  /** The output of squiggle's run */
  result: ReturnType<typeof useSquiggle>["result"];
  localSettingsEnabled?: boolean;
} & PartialPlaygroundSettings;

export const SquiggleViewer = memo<SquiggleViewerProps>(
  function SquiggleViewer({
    result,
    localSettingsEnabled = false,
    ...partialPlaygroundSettings
  }) {
    return (
      <ViewerProvider
        partialPlaygroundSettings={partialPlaygroundSettings}
        localSettingsEnabled={localSettingsEnabled}
      >
        {result.ok ? (
          <ExpressionViewer value={result.value} />
        ) : (
          <SquiggleErrorAlert error={result.value} />
        )}
      </ViewerProvider>
    );
  }
);
