import { add, subtract } from '../../src/utils/math';

describe('math utils', () => {
  test('add function', () => {
    expect(add(1, 2)).toBe(3);
  });

  test('subtract function', () => {
    expect(subtract(2, 1)).toBe(1);
  });
});
