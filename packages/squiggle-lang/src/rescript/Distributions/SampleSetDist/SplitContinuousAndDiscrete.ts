export default (sortedArray: number[], minDiscreteWeight: number) => {
  const continuous: number[] = [];
  const discreteCount: number[] = [];
  const discreteValue: number[] = [];

  // Weight of 1 is pointless because it indicates only discrete values,
  // and causes an infinite loop in the doubling search used here.
  if (minDiscreteWeight <= 1) {
    throw Error("Minimum discrete weight must be at least 1");
  }

  // In a run of exactly minDiscreteWeight, the first and last
  // element indices differ by minDistance.
  const minDistance = minDiscreteWeight - 1;

  const len = sortedArray.length;
  let i = 0;
  while (i < len - minDistance) {
    // We are interested in runs of elements equal to value
    const value = sortedArray[i];
    if (value !== sortedArray[i + minDistance]) {
      // No long run starting at i, so it's continuous
      continuous.push(value);
      i++;
    } else {
      // Now we know that a run starts at i
      // Move i forward to next unequal value
      // That is, find iNext so that isEqualAt(iNext-1) and !isEqualAt(iNext)
      const iOrig = i;
      // Find base so that iNext is in (iOrig+base, iOrig+2*base]
      // This is where we start the binary search
      let base = minDistance;
      const isEqualAt = (ind: number) =>
        ind < len && sortedArray[ind] === value;
      while (isEqualAt(iOrig + base * 2)) {
        base *= 2;
      }
      // Maintain iNext in (lo, i]. Once lo+1 === i, i is iNext.
      let lo = iOrig + base;
      i = Math.min(lo + base, len);
      while (i - lo > 1) {
        const mid = lo + (i - lo) / 2;
        if (sortedArray[mid] === value) {
          lo = mid;
        } else {
          i = mid;
        }
      }

      discreteValue.push(value);
      discreteCount.push(i - iOrig);
    }
  }
  // Remaining values are continuous
  continuous.push(...sortedArray.slice(i));

  return {
    continuousPart: continuous,
    discretePart: { xs: discreteValue, ys: discreteCount },
  };
};
