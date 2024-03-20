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
    test("returns the difference between two MixedSets", () => {
      const support1 = new MixedSet(
        [1, 2, 3],
        [
          [0, 1],
          [3, 5],
        ]
      );
      const support2 = new MixedSet(
        [2, 4],
        [
          [1, 2],
          [3, 4],
        ]
      );
      const difference = support1.subtract(support2);
      expect(difference.points).toEqual([1, 3]);
      expect(difference.segments).toEqual([
        [0, 1],
        [4, 5],
      ]);
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
