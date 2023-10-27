import { linearRegression } from '../../src/fr/linearRegression';
import { normal, uniform } from '../../src/dist';

describe('linearRegression', () => {
  test('calculates correct slope and intercept for two normal distributions', () => {
    const x = normal(0, 1, 1000);
    const y = x.map(val => 2 * val + 3);
    const { slope, intercept } = linearRegression(x, y);
    expect(slope).toBeCloseTo(2, 2);
    expect(intercept).toBeCloseTo(3, 2);
  });

  test('calculates correct slope and intercept for normal and uniform distributions', () => {
    const x = normal(0, 1, 1000);
    const y = uniform(0, 1, 1000);
    const { slope, intercept } = linearRegression(x, y);
    const expectedSlope = (y.reduce((sum, val) => sum + val, 0) / y.length) / (x.reduce((sum, val) => sum + val, 0) / x.length);
    const expectedIntercept = (y.reduce((sum, val) => sum + val, 0) / y.length) - expectedSlope * (x.reduce((sum, val) => sum + val, 0) / x.length);
    expect(slope).toBeCloseTo(expectedSlope, 2);
    expect(intercept).toBeCloseTo(expectedIntercept, 2);
  });

  test('calculates correct slope and intercept for distributions of different sizes', () => {
    const x = normal(0, 1, 1000);
    const y = normal(0, 1, 500);
    const { slope, intercept } = linearRegression(x, y);
    const expectedSlope = (y.reduce((sum, val) => sum + val, 0) / y.length) / (x.reduce((sum, val) => sum + val, 0) / x.length);
    const expectedIntercept = (y.reduce((sum, val) => sum + val, 0) / y.length) - expectedSlope * (x.reduce((sum, val) => sum + val, 0) / x.length);
    expect(slope).toBeCloseTo(expectedSlope, 2);
    expect(intercept).toBeCloseTo(expectedIntercept, 2);
  });
});
