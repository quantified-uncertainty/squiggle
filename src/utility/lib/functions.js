/**
 * @param {number} xMin
 * @param {number} xMax
 * @param {number} yMin
 * @param {number} yMax
 * @param {number} xIntended
 * @return {number}
 */
function interpolate(xMin, xMax, yMin, yMax, xIntended) {
  const minProportion = (xMax - xIntended) / (xMax - xMin);
  const maxProportion = (xIntended - xMin) / (xMax - xMin);
  return (yMin * minProportion) + (yMax * maxProportion);
}

/**
 * This should return an array of n evenly-spaced items
 * between min and max, including min and max.
 * range(1,5,3) = [1, 3, 5];
 * range(1,5,5) = [1, 2, 3, 4, 5];
 * @param {number} min
 * @param {number} max
 * @param {number} n
 * @return {number[]}
 */
function range(min, max, n) {
  if (n <= 0) throw new RangeError('n is less then zero');
  if (n === Infinity) throw new RangeError('n is Infinity');
  if (n === 0) return [];
  if (n === 1) return [min];
  if (n === 2) return [min, max];
  if (min === max) return Array(n).fill(min);
  n -= 1;
  const diff = min - max;
  const interval = Math.abs(diff / n);

  const result = [];

  let item = min;
  do {
    result.push(item);
    item += interval;
  } while (item <= max);

  // corrects results because of math errors
  if ((n + 1) - result.length === 1) {
    result.push(max);
  }

  return result;
}

/**
 * @param {number[]} arr
 * @return {number}
 */
function sum(arr) {
  return arr.reduce((acc, val) => acc + val, 0);
}

/**
 * @param {number[]} arr
 * @return {number}
 */
function mean(arr) {
  return sum(arr) / arr.length;
}

/**
 * @param {number[]} arr
 * @return {number}
 */
function min(arr) {
  let val = arr[0];
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] < val) {
      val = arr[i];
    }
  }
  return val;
}

/**
 * @param {number[]} arr
 * @return {number}
 */
function max(arr) {
  let val = arr[0];
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] > val) {
      val = arr[i];
    }
  }
  return val;
}

/**
 * @param {number} min
 * @param {number} max
 * @return {number}
 */
function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

/**
 * @param {number} from
 * @param {number} to
 * @return {number[]}
 */
function up(from, to) {
  const arr = [];
  for (let i = from; i <= to; i++) arr.push(i);
  return arr;
}

/**
 * @param {number} from
 * @param {number} to
 * @return {number[]}
 */
function down(from, to) {
  const arr = [];
  for (let i = from; i >= to; i--) arr.push(i);
  return arr;
}

module.exports = {
  interpolate,
  min,
  max,
  range,
  mean,
  random,
  up,
  down,
};