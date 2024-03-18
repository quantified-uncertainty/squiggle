import { PointSetDomain } from "../../src/PointSet/PointSetDomain.js";
import { XYShape } from "../../src/XYShape.js";

describe("PointSetDomain", () => {
  describe("fromContinuousShape", () => {
    test("creates a PointSetDomain with segments from a continuous shape", () => {
      const continuousShape: XYShape = {
        xs: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        ys: [0, 3, 8, 0, 0, 0, 1, 0, 0, 1, 0],
      };
      const domain = PointSetDomain.fromContinuousShape(continuousShape);
      expect(domain.points).toEqual([]);
      expect(domain.segments).toEqual([
        [0, 3],
        [5, 7],
        [8, 10],
      ]);
    });
  });

  describe("difference", () => {
    test("returns the difference between two PointSetDomains", () => {
      const domain1 = new PointSetDomain(
        [1, 2, 3],
        [
          [0, 1],
          [3, 5],
        ]
      );
      const domain2 = new PointSetDomain(
        [2, 4],
        [
          [1, 2],
          [3, 4],
        ]
      );
      const difference = domain1.difference(domain2);
      expect(difference.points).toEqual([1, 3]);
      expect(difference.segments).toEqual([
        [0, 1],
        [4, 5],
      ]);
    });
  });

  describe("empty", () => {
    test("returns true for an empty PointSetDomain", () => {
      const emptyDomain = new PointSetDomain([], []);
      expect(emptyDomain.empty()).toBe(true);
    });

    test("returns false for a non-empty PointSetDomain", () => {
      const nonEmptyDomain = new PointSetDomain([1], []);
      expect(nonEmptyDomain.empty()).toBe(false);
    });
  });

  describe("minX", () => {
    test("returns the minimum x-value from points and segments", () => {
      const domain = new PointSetDomain(
        [1, 2],
        [
          [0, 1],
          [3, 4],
        ]
      );
      expect(domain.minX()).toBe(0);
    });

    test("returns undefined for an empty PointSetDomain", () => {
      const emptyDomain = new PointSetDomain([], []);
      expect(emptyDomain.minX()).toBeUndefined();
    });
  });

  describe("maxX", () => {
    test("returns the maximum x-value from points and segments", () => {
      const domain = new PointSetDomain(
        [1, 2],
        [
          [0, 1],
          [3, 4],
        ]
      );
      expect(domain.maxX()).toBe(4);
    });

    test("returns undefined for an empty PointSetDomain", () => {
      const emptyDomain = new PointSetDomain([], []);
      expect(emptyDomain.maxX()).toBeUndefined();
    });
  });
});
