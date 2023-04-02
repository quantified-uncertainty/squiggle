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
