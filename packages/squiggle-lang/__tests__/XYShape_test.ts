import * as XYShape from "../src/XYShape.js";

const makeAndGetErrorString = (
  xs: number[],
  ys: number[]
): string | undefined => {
  const result = XYShape.T.make(xs, ys);
  if (result.ok) {
    return undefined;
  }
  return XYShape.XYShapeError.toString(result.value);
};

describe("XYShapes", () => {
  describe("Validator", () => {
    test("with no errors", () => {
      expect(makeAndGetErrorString([1.0, 4.0, 8.0], [0.2, 0.4, 0.8])).toBe(
        undefined
      );
    });
    test("when empty", () => {
      expect(makeAndGetErrorString([], [])).toBe("Xs is empty");
    });
    test("not sorted", () => {
      expect(makeAndGetErrorString([2, 1], [5, 6])).toBe("Xs is not sorted");
    });
    test("different lengths", () => {
      expect(makeAndGetErrorString([1, 2, 3], [1, 2])).toBe(
        "Xs and Ys have different lengths. Xs has length 3 and Ys has length 2"
      );
    });
    test("infinity", () => {
      expect(makeAndGetErrorString([1, 2, Infinity], [1, 2, 3])).toBe(
        "Xs is not finite. Example value: Infinity"
      );
    });
    test("multiple errors", () => {
      expect(makeAndGetErrorString([2, 1, Infinity, 0], [3, NaN])).toBe(
        "Multiple Errors: [Xs is not sorted], [Xs and Ys have different lengths. Xs has length 4 and Ys has length 2], [Xs is not finite. Example value: Infinity], [Ys is not finite. Example value: NaN]"
      );
    });
  });

  describe("integrateWithTriangles", () => {
    test("integrates correctly", () => {
      const shape = XYShape.T.make([1, 4, 8], [0.2, 0.4, 0.8]);
      if (!shape.ok) {
        throw new Error("make failed");
      }
      expect(XYShape.Range.integrateWithTriangles(shape.value)).toEqual({
        xs: [1, 4, 8],
        ys: [0.0, 0.9000000000000001, 3.3000000000000007],
      });
    });
  });
});

describe("ToSegments", () => {
  const shape: XYShape.XYShape = {
    xs: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    ys: [1, 2, 3, 4, 3, 2, 3, 4, 5, 1],
  };

  describe("greaterThan", () => {
    test("returns segments above the threshold", () => {
      const threshold = 2.5;
      const segments = XYShape.extractSubsetThatSatisfiesThreshold(
        shape,
        "greaterThan",
        threshold
      );

      expect(segments).toEqual({
        segments: [
          {
            xs: [1.5, 2, 3, 4, 4.5],
            ys: [2.5, 3, 4, 3, 2.5],
          },
          {
            xs: [5.5, 6, 7, 8, 8.625],
            ys: [2.5, 3, 4, 5, 2.5],
          },
        ],
        points: [],
      });
    });

    test("returns empty array when no segments above the threshold", () => {
      const threshold = 10;
      const segments = XYShape.extractSubsetThatSatisfiesThreshold(
        shape,
        "greaterThan",
        threshold
      );

      expect(segments).toEqual({ segments: [], points: [] });
    });
  });

  describe("lesserThan", () => {
    test("returns segments below the threshold", () => {
      const threshold = 2.5;
      const segments = XYShape.extractSubsetThatSatisfiesThreshold(
        shape,
        "lesserThan",
        threshold
      );

      expect(segments).toEqual({
        segments: [
          {
            xs: [0, 1, 1.5],
            ys: [1, 2, 2.5],
          },
          {
            xs: [4.5, 5, 5.5],
            ys: [2.5, 2, 2.5],
          },
          {
            xs: [8.625, 9],
            ys: [2.5, 1],
          },
        ],
        points: [],
      });
    });

    test("returns empty array when no segments below the threshold", () => {
      const threshold = 0;
      const segments = XYShape.extractSubsetThatSatisfiesThreshold(
        shape,
        "lesserThan",
        threshold
      );

      expect(segments).toEqual({ segments: [], points: [] });
    });
  });

  describe("equals", () => {
    test("returns segments equal to the threshold", () => {
      const threshold = 4;
      const segments = XYShape.extractSubsetThatSatisfiesThreshold(
        shape,
        "equals",
        threshold
      );

      expect(segments).toEqual({
        points: [
          [3, 4],
          [7, 4],
          [8.25, 4],
        ],
        segments: [],
      });
    });

    test("returns segments equal to the threshold, when interpolation is needed", () => {
      const threshold = 2.5;
      const segments = XYShape.extractSubsetThatSatisfiesThreshold(
        shape,
        "equals",
        threshold
      );

      expect(segments).toEqual({
        segments: [],
        points: [
          [1.5, 2.5],
          [4.5, 2.5],
          [5.5, 2.5],
          [8.625, 2.5],
        ],
      });
    });
    test("returns segments when part of the line is at value", () => {
      const threshold = 3;
      const shape: XYShape.XYShape = {
        xs: [0, 1, 2, 3, 8, 9],
        ys: [0, 0, 0, 3, 3, 0],
      };
      const segments = XYShape.extractSubsetThatSatisfiesThreshold(
        shape,
        "equals",
        threshold
      );

      expect(segments).toEqual({
        points: [],
        segments: [
          {
            xs: [3, 8],
            ys: [3, 3],
          },
        ],
      });
    });

    test("returns empty array when no segments equal to the threshold", () => {
      const threshold = 10;
      const segments = XYShape.extractSubsetThatSatisfiesThreshold(
        shape,
        "equals",
        threshold
      );

      expect(segments).toEqual({ segments: [], points: [] });
    });
  });

  describe("greaterThanOrEquals", () => {
    test("returns segments greater than or equal to the threshold", () => {
      const threshold = 3;
      const segments = XYShape.extractSubsetThatSatisfiesThreshold(
        shape,
        "greaterThanOrEqual",
        threshold
      );
      expect(segments).toEqual({
        points: [],
        segments: [
          {
            xs: [2, 3, 4],
            ys: [3, 4, 3],
          },
          {
            xs: [6, 7, 8, 8.5],
            ys: [3, 4, 5, 3],
          },
        ],
      });
    });
  });

  describe("lessThanOrEquals", () => {
    test("returns segments less than or equal to the threshold", () => {
      const threshold = 2;
      const segments = XYShape.extractSubsetThatSatisfiesThreshold(
        shape,
        "lessThanOrEqual",
        threshold
      );
      expect(segments).toEqual({
        points: [[5, 2]],
        segments: [
          {
            xs: [0, 1],
            ys: [1, 2],
          },
          {
            xs: [8.75, 9],
            ys: [2, 1],
          },
        ],
      });
    });
  });
});
