import { FC } from "react";

import { SqValue } from "@quri/squiggle-lang";

import { SquiggleOutput } from "../../lib/hooks/useSquiggle.js";
import { ErrorBoundary } from "../ErrorBoundary.js";
import { SquiggleErrorAlert } from "../SquiggleErrorAlert.js";
import { SquiggleViewer } from "../SquiggleViewer/index.js";
import { ViewerMode } from "./index.js";

type Props = {
  mode: ViewerMode;
  squiggleOutput: SquiggleOutput;
  isRunning: boolean;
};

export const ViewerBody: FC<Props> = ({ squiggleOutput, mode, isRunning }) => {
  const { output, code } = squiggleOutput;

  if (!code) {
    return null;
  }

  if (!output.ok) {
    return <SquiggleErrorAlert error={output.value} />;
  }

  const sqOutput = output.value;
  let usedValue: SqValue | undefined;
  switch (mode) {
    case "Result":
      usedValue = output.value.result;
      break;
    case "Variables":
      usedValue = sqOutput.bindings.asValue();
      break;
    case "Imports":
      usedValue = sqOutput.imports.asValue();
      break;
    case "Exports":
      usedValue = sqOutput.exports.asValue();
  }

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
