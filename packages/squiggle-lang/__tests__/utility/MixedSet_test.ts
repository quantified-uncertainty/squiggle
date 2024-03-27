import { MixedSet } from "../../src/utility/MixedSet.js";
import { XYShape } from "../../src/XYShape.js";

describe("MixedSet", () => {
  describe("fromContinuousDistShape", () => {
    test("creates a MixedSet with segments from a continuous shape", () => {
      const continuousShape: XYShape = {
        xs: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        ys: [0, 3, 8, 0, 0, 0, 1, 0, 0, 1, 0],
      };
      const support = MixedSet.fromContinuousDistShape(continuousShape);
      expect(support.points).toEqual([]);
      expect(support.segments).toEqual([
        [0, 3],
        [5, 7],
        [8, 10],
      ]);
    });
  });

  describe("subtract", () => {
    const testCases = [
      {
        set1: new MixedSet([1, 2, 3], [[0, 10]]),
        set2: new MixedSet([2, 4], [[5, 6]]),
        expected: {
          points: [1, 3],
          segments: [
            [0, 5],
            [6, 10],
          ],
        },
      },
      {
        set1: new MixedSet([], []),
        set2: new MixedSet([1, 2], [[3, 4]]),
        expected: { points: [], segments: [] },
      },
      {
        set1: new MixedSet([1, 2], [[3, 4]]),
        set2: new MixedSet([], []),
        expected: { points: [1, 2], segments: [[3, 4]] },
      },
      {
        set1: new MixedSet([1, 2, 3, 4], []),
        set2: new MixedSet([2, 4], []),
        expected: { points: [1, 3], segments: [] },
      },
      {
        set1: new MixedSet(
          [],
          [
            [0, 5],
            [7, 10],
          ]
        ),
        set2: new MixedSet(
          [],
          [
            [2, 4],
            [8, 9],
          ]
        ),
        expected: {
          points: [],
          segments: [
            [0, 2],
            [4, 5],
            [7, 8],
            [9, 10],
          ],
        },
      },
      {
        set1: new MixedSet(
          [1, 3, 5],
          [
            [0, 2],
            [4, 6],
            [8, 10],
          ]
        ),
        set2: new MixedSet(
          [3],
          [
            [1, 5],
            [9, 10],
          ]
        ),
        expected: {
          points: [1, 5],
          segments: [
            [0, 1],
            [5, 6],
            [8, 9],
          ],
        },
      },
    ];

    testCases.forEach(({ set1, set2, expected }) => {
      test(`returns the difference between ${JSON.stringify(set1)} and ${JSON.stringify(set2)}`, () => {
        const difference = set1.difference(set2);

        expect(difference.points).toEqual(expected.points);
        expect(difference.segments).toEqual(expected.segments);
      });
    });
  });

  describe("minX", () => {
    test("returns the minimum x-value from points and segments", () => {
      const support = new MixedSet(
        [1, 2],
        [
          [0, 1],
          [3, 4],
        ]
      );
      expect(support.minX()).toBe(0);
    });

    test("returns undefined for an empty MixedSet", () => {
      const emptyDomain = new MixedSet([], []);
      expect(emptyDomain.minX()).toBeUndefined();
    });
  });

  describe("maxX", () => {
    test("returns the maximum x-value from points and segments", () => {
      const support = new MixedSet(
        [1, 2],
        [
          [0, 1],
          [3, 4],
        ]
      );
      expect(support.maxX()).toBe(4);
    });

    test("returns undefined for an empty MixedSet", () => {
      const emptyDomain = new MixedSet([], []);
      expect(emptyDomain.maxX()).toBeUndefined();
    });
  });
});
