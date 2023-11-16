import { memo } from "react";

import { valueHasContext } from "../../lib/utility.js";
import { SqValueResult } from "../../widgets/CalculatorWidget/types.js";
import { PlaygroundSettings } from "../PlaygroundSettings.js";
import { SquiggleValueChart } from "./SquiggleValueChart.js";

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
      return <SquiggleValueChart value={value} settings={settings} />;
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
