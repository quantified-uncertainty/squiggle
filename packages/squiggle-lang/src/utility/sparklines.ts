// Port of Sindre Sorhus' Sparkly
// reference implementation: https://github.com/sindresorhus/sparkly
// Omitting rgb "fire" style, so no `chalk` dependency
// Omitting: NaN handling, special consideration for constant data.

const ticks = [`▁`, `▂`, `▃`, `▄`, `▅`, `▆`, `▇`, `█`];

const _ticksLength = ticks.length;

const _heightToTickIndex = (maximum: number, v: number) => {
  const suggestedTickIndex = Math.ceil((v / maximum) * _ticksLength) - 1;
  return Math.max(suggestedTickIndex, 0);
};

export const createSparkline = (
  relativeHeights: number[],
  maximum: number | undefined = undefined
): string => {
  if (relativeHeights.length === 0) {
    return "";
  } else {
    const usedMaximum = maximum ?? Math.max(...relativeHeights);

    return relativeHeights
      .map((v) => _heightToTickIndex(usedMaximum, v))
      .map((r) => ticks[r])
      .join("");
  }
};
