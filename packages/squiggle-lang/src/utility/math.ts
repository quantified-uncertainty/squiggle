/**
 * Searches for a first element in `arr` greater than `value`
 * For more info:
 * https://github.com/quantified-uncertainty/squiggle/pull/1290#issuecomment-1302224197
 */
function binsearchFirstGreater(arr: number[], value: number): number {
  let s = -1; // Largest index known <=value
  let l = arr.length + 1; // Result is in (s,s+l]
  for (let h; (h = l >> 1) > 0; l -= h) {
    s += h * +(arr[s + h] <= value);
  }
  return s + 1;
}

export function random_sample(
  dist: number[],
  args: { probs: number[]; size: number }
): number[] {
  const { probs, size } = args;
  const sample: number[] = Array(size);

  let accum = 0;
  const probPrefixSums = Array(probs.length);
  for (let index = 0; index < probs.length; index++) {
    probPrefixSums[index] = accum += probs[index];
  }
  const sum = probPrefixSums[probPrefixSums.length - 1];

  for (let index = 0; index < size; index++) {
    const selection = binsearchFirstGreater(
      probPrefixSums,
      Math.random() * sum
    );
    sample[index] = dist[selection];
  }
  return sample;
}
