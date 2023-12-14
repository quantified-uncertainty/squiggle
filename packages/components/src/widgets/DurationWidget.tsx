import { clsx } from "clsx";

import {
  SqBoxedValue,
  SqDurationValue,
} from "../../../squiggle-lang/src/public/SqValue/index.js";
import { NumberShower } from "../components/NumberShower.js";
import { formatNumber } from "../lib/d3/index.js";
import { widgetRegistry } from "./registry.js";
import { leftWidgetMargin } from "./utils.js";

const showDuration = (
  duration: SqDurationValue,
  boxed: SqBoxedValue | undefined
) => {
  const numberFormat = boxed?.value.numberFormat();
  const { unitName, value } = duration.toUnitAndNumber();
  if (numberFormat) {
    return `${formatNumber(numberFormat, value)} ${unitName}s`;
  } else {
    return <NumberShower precision={4} number={value} unitName={unitName} />;
  }
};

widgetRegistry.register("Duration", {
  Preview: (value, boxed) => showDuration(value, boxed),
  Chart: (value, _, boxed) => {
    return (
      <div className={clsx("font-semibold text-indigo-800", leftWidgetMargin)}>
        {showDuration(value, boxed)}
      </div>
    );
  },
});
