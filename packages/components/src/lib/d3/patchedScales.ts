import * as d3 from "d3";

type CustomFormat = "squiggle-default" | undefined;

// see lib/d3/index.ts
export const defaultTickFormatSpecifier: CustomFormat = "squiggle-default";

function isCustomFormat(
  specifier: string | undefined
): specifier is CustomFormat {
  return specifier === "squiggle-default" || specifier === undefined;
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
    if (abs === 0) {
      return fixedFormat(d);
    } else if (abs < 0.00001) {
      return expFormat(d);
    } else if (abs < 1e6) {
      return fixedFormat(d);
    } else if (abs < 1e9) {
      return siFormat(d);
    } else if (abs < 1e12) {
      return fixedFormat(Number(d) / 1e9) + "B";
    } else if (abs < 1e15) {
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

type ScaleLinear = d3.ScaleLinear<number, number, never>;
type ScaleLogarithmic = d3.ScaleLogarithmic<number, number, never>;
type ScaleSymLog = d3.ScaleSymLog<number, number, never>;
type ScalePower = d3.ScalePower<number, number, never>;

function patchLinearishTickFormat<
  T extends ScaleLinear | ScaleSymLog | ScalePower,
>(scale: T): T {
  // copy-pasted from https://github.com/d3/d3-scale/blob/83555bd759c7314420bd4240642beda5e258db9e/src/linear.js#L14
  scale.tickFormat = (count, specifier) => {
    const d = scale.domain();
    return tickFormatWithCustom(d[0], d[d.length - 1], count ?? 10, specifier);
  };

  return scale;
}

function patchSymlogTickFormat(scale: ScaleSymLog): ScaleSymLog {
  // copy-pasted from https://github.com/d3/d3-scale/blob/83555bd759c7314420bd4240642beda5e258db9e/src/linear.js#L14
  scale.tickFormat = (count, specifier) => {
    const d = scale.domain();
    return tickFormatWithCustom(d[0], d[d.length - 1], count ?? 10, specifier);
  };
  // UPSTREAM-ME: Patching symlog tick generator for better experience
  scale.ticks = (count?: number) => {
    if (count === 0) return [];

    const [lower, upper] = scale.domain();
    const c = scale.constant();

    // We can't reliably use invert and transform from scale
    // It converts relative to screen, and we would instead like it to be relative to 0
    // const transform = scale
    // const invert = scale.invert

    function transform(x: number): number {
      return Math.sign(x) * Math.log1p(Math.abs(x / c));
    }

    function invert(x: number): number {
      return Math.sign(x) * Math.expm1(Math.abs(x)) * c;
    }

    /**
     * @param [rounding=Math.round] Rounding method
     * @returns Closest number with a single significant digit being 1, 2 or 5
     */
    function roundToNice(x: number, rounding = Math.round): number {
      if (x === 0) return 0;

      const base = Math.floor(Math.log10(Math.abs(x)));
      const zeros = Math.pow(10, base);
      const mult = Math.abs(rounding(x / zeros));

      // https://oeis.org/A002522
      // It works for our range.
      const niceMult =
        mult == 0
          ? 0
          : Math.pow(
              Math.abs(rounding(Math.sign(x) * Math.sqrt(mult - 1))),
              2
            ) + 1;

      // There's also https://oeis.org/A051109, but I don't have whole day

      return niceMult * zeros * Math.sign(x);
    }

    function closestNice(x: number) {
      return roundToNice(x);
    }

    const normCount = count ?? 10;

    // Sometimes users don't know what they want -- and they actually don't want symlog
    const expSize = Math.abs(transform(lower) - transform(upper));

    // If exponent window is too small, then let's try linear scale instead
    if (expSize / normCount < 0.5) {
      const reqPrecision = Math.pow(
        10,
        Math.floor(Math.log10(upper - lower) - 1)
      );
      const pLower = Math.ceil(lower / reqPrecision) * reqPrecision;
      const pUpper = Math.floor(upper / reqPrecision) * reqPrecision;

      const linSize = pUpper - pLower;

      // Alternative linear route.
      const digits = Math.floor(Math.log10(linSize));
      let tickNumber = linSize / Math.pow(10, digits);
      while (tickNumber * 1.5 < normCount) tickNumber *= 2;
      return d3.range(pLower, pUpper, linSize / tickNumber).concat([pUpper]);
    }

    const tLower = transform(roundToNice(lower, Math.ceil));
    const tUpper = transform(roundToNice(upper, Math.floor));
    const expStep = (tUpper - tLower) / normCount;
    const tLowerAdjusted = !(tUpper > 0 && tLower < 0)
      ? tLower + expStep / 2
      : Math.ceil(tLower / expStep) * expStep;
    const tickRange = d3.range(tLowerAdjusted, tUpper, expStep);

    const ticks = [roundToNice(lower, Math.ceil)].concat(
      tickRange.map(invert).map(closestNice),
      [roundToNice(upper, Math.floor)]
    );

    return ticks;
  };

  return scale;
}

function patchLogarithmicTickFormat(scale: ScaleLogarithmic): ScaleLogarithmic {
  const logScaleTickFormat = scale.tickFormat;
  scale.tickFormat = (count, specifier) => {
    return logScaleTickFormat(
      count,
      isCustomFormat(specifier)
        ? // Log scale tickFormat method supports functions, but @types/d3 is not aware of that:
          // https://github.com/d3/d3-scale/blob/83555bd759c7314420bd4240642beda5e258db9e/src/log.js#L109
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (squiggleDefaultFormat() as any)
        : specifier
    );
  };
  return scale;
}

// Original d3.scale* should never be used; they won't support our custom tick formats.

export function scaleLinear() {
  return patchLinearishTickFormat(d3.scaleLinear());
}

export function scaleSymlog() {
  return patchSymlogTickFormat(d3.scaleSymlog());
}

export function scalePow() {
  return patchLinearishTickFormat(d3.scalePow());
}

export function scaleLog() {
  return patchLogarithmicTickFormat(d3.scaleLog());
}
