import { PointSetSupport } from "../../src/PointSet/PointSetSupport.js";
import { XYShape } from "../../src/XYShape.js";

describe("PointSetSupport", () => {
  describe("fromContinuousShape", () => {
    test("creates a PointSetSupport with segments from a continuous shape", () => {
      const continuousShape: XYShape = {
        xs: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        ys: [0, 3, 8, 0, 0, 0, 1, 0, 0, 1, 0],
      };
      const support = PointSetSupport.fromContinuousShape(continuousShape);
      expect(support.points).toEqual([]);
      expect(support.segments).toEqual([
        [0, 3],
        [5, 7],
        [8, 10],
      ]);
    });
  });

  describe("difference", () => {
    test("returns the difference between two PointSetSupports", () => {
      const support1 = new PointSetSupport(
        [1, 2, 3],
        [
          [0, 1],
          [3, 5],
        ]
      );
      const support2 = new PointSetSupport(
        [2, 4],
        [
          [1, 2],
          [3, 4],
        ]
      );
      const difference = support1.difference(support2);
      expect(difference.points).toEqual([1, 3]);
      expect(difference.segments).toEqual([
        [0, 1],
        [4, 5],
      ]);
    });
  });

  describe("empty", () => {
    test("returns true for an empty PointSetSupport", () => {
      const emptyDomain = new PointSetSupport([], []);
      expect(emptyDomain.empty()).toBe(true);
    });

    test("returns false for a non-empty PointSetSupport", () => {
      const nonEmptyDomain = new PointSetSupport([1], []);
      expect(nonEmptyDomain.empty()).toBe(false);
    });
  });

  describe("minX", () => {
    test("returns the minimum x-value from points and segments", () => {
      const support = new PointSetSupport(
        [1, 2],
        [
          [0, 1],
          [3, 4],
        ]
      );
      expect(support.minX()).toBe(0);
    });

    test("returns undefined for an empty PointSetSupport", () => {
      const emptyDomain = new PointSetSupport([], []);
      expect(emptyDomain.minX()).toBeUndefined();
    });
  });

  describe("maxX", () => {
    test("returns the maximum x-value from points and segments", () => {
      const support = new PointSetSupport(
        [1, 2],
        [
          [0, 1],
          [3, 4],
        ]
      );
      expect(support.maxX()).toBe(4);
    });

    test("returns undefined for an empty PointSetSupport", () => {
      const emptyDomain = new PointSetSupport([], []);
      expect(emptyDomain.maxX()).toBeUndefined();
    });
  });
});
