import { RangeSet } from "../../src/utility/RangeSet.js";

describe("RangeSet", () => {
  describe("difference", () => {
    const testCases = [
      {
        set1: new RangeSet([[0, 10]]),
        set2: new RangeSet([[5, 6]]),
        expected: [
          [0, 5],
          [6, 10],
        ],
      },
      {
        set1: new RangeSet([]),
        set2: new RangeSet([[3, 4]]),
        expected: [],
      },
      {
        set1: new RangeSet([[3, 4]]),
        set2: new RangeSet([]),
        expected: [[3, 4]],
      },
      {
        set1: new RangeSet([
          [0, 5],
          [7, 10],
        ]),
        set2: new RangeSet([
          [2, 4],
          [8, 9],
        ]),
        expected: [
          [0, 2],
          [4, 5],
          [7, 8],
          [9, 10],
        ],
      },
    ];

    testCases.forEach(({ set1, set2, expected }) => {
      test(`returns the difference between ${JSON.stringify(set1)} and ${JSON.stringify(set2)}`, () => {
        const difference = set1.difference(set2);
        expect(difference.ranges).toEqual(expected);
      });
    });
  });

  describe("intersection", () => {
    const testCases = [
      {
        set1: new RangeSet([[0, 10]]),
        set2: new RangeSet([[5, 6]]),
        expected: [[5, 6]],
      },
      {
        set1: new RangeSet([]),
        set2: new RangeSet([[3, 4]]),
        expected: [],
      },
      {
        set1: new RangeSet([[3, 4]]),
        set2: new RangeSet([]),
        expected: [],
      },
      {
        set1: new RangeSet([
          [0, 5],
          [7, 10],
        ]),
        set2: new RangeSet([
          [2, 4],
          [8, 9],
        ]),
        expected: [
          [2, 4],
          [8, 9],
        ],
      },
    ];

    testCases.forEach(({ set1, set2, expected }) => {
      test(`returns the intersection between ${JSON.stringify(set1)} and ${JSON.stringify(set2)}`, () => {
        const intersection = set1.intersection(set2);
        expect(intersection.ranges).toEqual(expected);
      });
    });
  });

  describe("union", () => {
    const testCases = [
      {
        set1: new RangeSet([[0, 10]]),
        set2: new RangeSet([[5, 6]]),
        expected: [[0, 10]],
      },
      {
        set1: new RangeSet([]),
        set2: new RangeSet([[3, 4]]),
        expected: [[3, 4]],
      },
      {
        set1: new RangeSet([[3, 4]]),
        set2: new RangeSet([]),
        expected: [[3, 4]],
      },
      {
        set1: new RangeSet([
          [0, 5],
          [7, 10],
        ]),
        set2: new RangeSet([
          [2, 4],
          [8, 12],
        ]),
        expected: [
          [0, 5],
          [7, 12],
        ],
      },
    ];

    testCases.forEach(({ set1, set2, expected }) => {
      test(`returns the union of ${JSON.stringify(set1)} and ${JSON.stringify(set2)}`, () => {
        const union = set1.union(set2);
        expect(union.ranges).toEqual(expected);
      });
    });
  });

  describe("isSubsetOf", () => {
    const testCases = [
      {
        set1: new RangeSet([[0, 5]]),
        set2: new RangeSet([[0, 10]]),
        expected: true,
      },
      {
        set1: new RangeSet([[0, 10]]),
        set2: new RangeSet([[0, 5]]),
        expected: false,
      },
      {
        set1: new RangeSet([]),
        set2: new RangeSet([[3, 4]]),
        expected: true,
      },
      {
        set1: new RangeSet([[3, 4]]),
        set2: new RangeSet([]),
        expected: false,
      },
      {
        set1: new RangeSet([[3, 4]]),
        set2: new RangeSet([[3, 4]]),
        expected: true,
      },
    ];

    testCases.forEach(({ set1, set2, expected }) => {
      test(`returns ${expected} for ${JSON.stringify(set1)}.isSubsetOf(${JSON.stringify(set2)})`, () => {
        expect(set1.isSubsetOf(set2)).toBe(expected);
      });
    });
  });

  describe("isSupersetOf", () => {
    const testCases = [
      {
        set1: new RangeSet([[0, 10]]),
        set2: new RangeSet([[0, 5]]),
        expected: true,
      },
      {
        set1: new RangeSet([[0, 5]]),
        set2: new RangeSet([[0, 10]]),
        expected: false,
      },
      {
        set1: new RangeSet([[3, 4]]),
        set2: new RangeSet([]),
        expected: true,
      },
      {
        set1: new RangeSet([]),
        set2: new RangeSet([[3, 4]]),
        expected: false,
      },
      {
        set1: new RangeSet([[3, 4]]),
        set2: new RangeSet([[3, 4]]),
        expected: true,
      },
    ];

    testCases.forEach(({ set1, set2, expected }) => {
      test(`returns ${expected} for ${JSON.stringify(set1)}.isSupersetOf(${JSON.stringify(set2)})`, () => {
        expect(set1.isSupersetOf(set2)).toBe(expected);
      });
    });
  });

  describe("min", () => {
    test("returns the minimum value from the ranges", () => {
      const rangeSet = new RangeSet([
        [0, 1],
        [3, 4],
      ]);
      expect(rangeSet.min()).toBe(0);
    });

    test("returns undefined for an empty RangeSet", () => {
      const emptyRangeSet = new RangeSet([]);
      expect(emptyRangeSet.min()).toBeUndefined();
    });
  });

  describe("max", () => {
    test("returns the maximum value from the ranges", () => {
      const rangeSet = new RangeSet([
        [0, 1],
        [3, 4],
      ]);
      expect(rangeSet.max()).toBe(4);
    });

    test("returns undefined for an empty RangeSet", () => {
      const emptyRangeSet = new RangeSet([]);
      expect(emptyRangeSet.max()).toBeUndefined();
    });
  });
});
