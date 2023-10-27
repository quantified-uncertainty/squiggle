import { Distribution } from '../dist/BaseDist';

export function linearRegression(x: Distribution, y: Distribution): { slope: number, intercept: number } {
  const meanX = x.reduce((sum, val) => sum + val, 0) / x.length;
  const meanY = y.reduce((sum, val) => sum + val, 0) / y.length;

  const diffsX = x.map(val => val - meanX);
  const diffsY = y.map(val => val - meanY);

  const numerator = diffsX.reduce((sum, val, i) => sum + val * diffsY[i], 0);
  const denominator = diffsX.reduce((sum, val) => sum + val * val, 0);

  const slope = numerator / denominator;
  const intercept = meanY - slope * meanX;

  return { slope, intercept };
}
