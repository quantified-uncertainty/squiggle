import { FC } from "react";

import { SqOutputResult } from "../../../../squiggle-lang/src/public/types.js";
import { ErrorBoundary } from "../ErrorBoundary.js";
import { SquiggleErrorAlert } from "../SquiggleErrorAlert.js";
import { SquiggleViewer } from "../SquiggleViewer/index.js";
import { modeToValue } from "../SquiggleViewer/utils.js";
import { ViewerMode } from "./index.js";

type Props = {
  mode: ViewerMode;
  output: SqOutputResult;
  isRunning: boolean;
};

export const ViewerBody: FC<Props> = ({ output, mode, isRunning }) => {
  if (!output.ok) {
    return <SquiggleErrorAlert error={output.value} />;
  }

  const sqOutput = output.value;

  if (mode === "AST") {
    return (
      <pre className="text-xs">
        {JSON.stringify(sqOutput.bindings.asValue().context?.ast, null, 2)}
      </pre>
    );
  }

  const usedValue = modeToValue(mode, output);

  if (!usedValue) {
    return null;
  }

  return (
    <div className="relative">
      {isRunning && (
        // `opacity-0 squiggle-semi-appear` would be better, but won't work reliably until we move Squiggle evaluation to Web Workers
        <div className="absolute z-10 inset-0 bg-white opacity-50" />
      )}
      <ErrorBoundary>
        {/* we don't pass settings or editor here because they're already configured in `<ViewerProvider>`; hopefully `<SquiggleViewer>` itself won't need to rely on settings, otherwise things might break */}
        <SquiggleViewer value={usedValue} />
      </ErrorBoundary>
    </div>
  );
};
