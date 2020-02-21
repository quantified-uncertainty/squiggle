const { interpolate } = require('./functions');
const { range } = require('./functions');
const { mean } = require('./functions');
const { min } = require('./functions');
const { max } = require('./functions');
const { random } = require('./functions');
const { up, down } = require('./functions');

describe('Functions', () => {
  it('interpolate()', () => {
    expect(interpolate(
      10, 20,
      1, 2,
      15
    )).toBe(1.5);
  });
  it('range()', () => {
    expect(range(1, 5, 3)).toEqual([1, 3, 5]);
    expect(range(1, 5, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(range(-10, 15, 2)).toEqual([-10, 15]);
    expect(range(-10, 15, 3)).toEqual([-10, 2.5, 15]);
    expect(range(-10.3, 17, 3)).toEqual([-10.3, 3.3499999999999996, 17]);
    expect(range(-10.3, 17, 5)).toEqual([-10.3, -3.4750000000000005, 3.3499999999999996, 10.175, 17]);
    expect(range(-10.3, 17.31, 3)).toEqual([-10.3, 3.504999999999999, 17.31]);
    expect(range(1, 1, 3)).toEqual([1, 1, 1]);
  });
  it('mean()', () => {
    expect(mean([1, 2, 3])).toBe(2);
    expect(mean([1, 2, 3, -2])).toBe(1);
    expect(mean([1, 2, 3, -2, -10])).toBe(-1.2);
  });
  it('min()', () => {
    expect(min([1, 2, 3])).toBe(1);
    expect(min([-1, -2, 0, 20])).toBe(-2);
    expect(min([-1, -2, 0, 20, -2.2])).toBe(-2.2);
  });
  it('max()', () => {
    expect(max([1, 2, 3])).toBe(3);
    expect(max([-1, -2, 0, 20])).toBe(20);
    expect(max([-1, -2, 0, -2.2])).toBe(0);
  });
  it('random()', () => {
    const num = random(1, 5);
    expect(num).toBeLessThanOrEqual(5);
    expect(num).toBeGreaterThanOrEqual(1);
  });
  it('up()', () => {
    expect(up(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(up(-1, 5)).toEqual([-1, 0, 1, 2, 3, 4, 5]);
  });
  it('down()', () => {
    expect(down(5, 1)).toEqual([5, 4, 3, 2, 1]);
    expect(down(5, -1)).toEqual([5, 4, 3, 2, 1, 0, -1]);
  });
});
