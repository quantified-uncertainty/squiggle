import { FC, memo, useMemo } from "react";

import { SqValueWithContext, valueHasContext } from "../../lib/utility.js";
import { PlaygroundSettings } from "../PlaygroundSettings.js";
// import { getSqValueWidget } from "../SquiggleViewer/getSqValueWidget.js";
import { GetSqValueWidget } from "../SquiggleViewer/getSqValueWidget2.js";
import { SqValueResult } from "./types.js";

// const Memoized = memo(function GetSqValueWidget({
//   value,
//   settings,
// }: {
//   value: SqValueWithContext;
//   settings: PlaygroundSettings;
// }) {
//   return <GetSqValueWidget value={value} settings={settings} />;
// });

const Memoized = memo(GetSqValueWidget);
// Unlike ValueViewer/ValueWithContextViewer, this just renders the raw widget; TODO - better name?
export const ValueResultViewer: FC<{
  result: SqValueResult;
  settings: PlaygroundSettings;
}> = ({ result, settings }) => {
  const memoizedValue = useMemo(() => result, [result]);
  const memoizedSettings = useMemo(() => settings, [settings]);
  if (memoizedValue.ok) {
    const value = memoizedValue.value;
    console.log("HI", value);
    if (valueHasContext(value)) {
      return <Memoized value={value} settings={memoizedSettings} />;
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
};
