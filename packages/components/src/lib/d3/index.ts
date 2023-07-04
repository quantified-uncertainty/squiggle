import * as d3 from "d3";

import { SqScale } from "@quri/squiggle-lang";

type CustomFormat = "squiggle-default";

function isCustomFormat(
  specifier: string | undefined
): specifier is CustomFormat {
  return specifier === undefined || specifier === "squiggle-default";
}

function squiggleDefaultFormat() {
  const locale = d3.formatLocale({
    decimal: ".",
    thousands: ",",
    grouping: [3],
    currency: ["$", ""],
    minus: "-",
  });
  const siFormat = locale.format(".9~s");
  const expFormat = locale.format(".9~e");
  const fixedFormat = locale.format(".9~f");

  return (d: d3.NumberValue) => {
    const abs = Math.abs(Number(d));
    if (abs === 0 || (abs >= 0.0001 && abs < 1e6)) {
      return fixedFormat(d);
    } else if (abs >= 1e9 && abs < 1e12) {
      return fixedFormat(Number(d) / 1e9) + "B";
    } else if (abs >= 1e6 && abs < 1e15) {
      return siFormat(d);
    } else {
      return expFormat(d);
    }
  };
}

function tickFormatWithCustom(
  start: number,
  stop: number,
  count: number,
  specifier: string | undefined
): ReturnType<typeof d3.tickFormat> {
  if (isCustomFormat(specifier)) {
    return squiggleDefaultFormat();
  }
  return d3.tickFormat(start, stop, count, specifier);
}

function patchLinearishTickFormat(
  scale:
    | d3.ScaleLinear<number, number, never>
    | d3.ScaleSymLog<number, number, never>
    | d3.ScalePower<number, number, never>
) {
  // copy-pasted from https://github.com/d3/d3-scale/blob/83555bd759c7314420bd4240642beda5e258db9e/src/linear.js#L14
  scale.tickFormat = (count, specifier) => {
    const d = scale.domain();
    return tickFormatWithCustom(d[0], d[d.length - 1], count ?? 10, specifier);
  };

  return scale;
}

export function sqScaleToD3(
  scale: SqScale
): d3.ScaleContinuousNumeric<number, number, never> {
  // Note that we don't set the domain here based on scale.max/scale.min.
  // That's because the domain can depend on the data that we draw, so that part is done later.

  // See also: `scaleTypeToSqScale` function in PlaygroundSettingsForm, for default scales we create when SqScale is not provided.
  switch (scale.tag) {
    case "linear":
      return patchLinearishTickFormat(d3.scaleLinear());
    case "symlog":
      return patchLinearishTickFormat(d3.scaleSymlog().constant(1));
    case "power":
      return patchLinearishTickFormat(d3.scalePow().exponent(scale.exponent));
    case "log": {
      // log scale tickFormat is special
      const scale = d3.scaleLog();
      const logScaleTickFormat = scale.tickFormat;
      scale.tickFormat = (count, specifier) => {
        return logScaleTickFormat(
          count,
          isCustomFormat(specifier)
            ? // Log scale tickFormat method supports functions, but @types/d3 is not aware of that:
              // https://github.com/d3/d3-scale/blob/83555bd759c7314420bd4240642beda5e258db9e/src/log.js#L109
              (squiggleDefaultFormat() as any)
            : specifier
        );
      };
      return scale;
    }
    default:
      throw new Error(`Unknown scale: ${scale satisfies never}`);
  }
}
