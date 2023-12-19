import { memo } from "react";

import { result, SqError, SqValue } from "@quri/squiggle-lang";

import { valueHasContext } from "../../lib/utility.js";
import { PlaygroundSettings } from "../PlaygroundSettings.js";
import { SquiggleValueChart } from "./SquiggleValueChart.js";

export type SqValueResult = result<SqValue, SqError>;

// Unlike ValueViewer/ValueWithContextViewer, this just renders the raw widget, or displays an error.
export const SquiggleValueResultChart = memo(function ValueResultViewer({
  result,
  settings,
}: {
  result: SqValueResult;
  settings: PlaygroundSettings;
}) {
  if (result.ok) {
    const value = result.value;
    if (valueHasContext(value)) {
      return (
        <SquiggleValueChart
          value={value}
          settings={settings}
          boxed={undefined}
        />
      );
    } else {
      return value.toString();
    }
  } else {
    return (
      <div className="text-sm text-red-800 text-opacity-70">
        {result.value.toString()}
      </div>
    );
  }
});
