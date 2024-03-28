import { Range, XYShape } from "../../src/XYShape.js";
import {
  convertToRectangles,
  Rectangle,
  yTransformContinuous,
  yTransformDiscrete,
} from "../../src/yTransform.js";

//The area of a shape should barely change after transformation
function getContinuousArea(shape: XYShape) {
  return Range.integrateWithTriangles(shape).ys.at(-1)!;
}
function getDiscreteArea(shape: XYShape) {
  return shape.ys.reduce((a, b) => a + b, 0);
}

describe("convertToRectangles", () => {
  const testCases: Array<{
    description: string;
    shape: XYShape;
    expectedRectangles: Rectangle[];
    expectedDiscrete: [number, number][];
  }> = [
    {
      description: "should convert a simple shape into rectangles",
      shape: {
        xs: [0, 1, 2],
        ys: [1, 2, 1],
      },
      expectedRectangles: [
        { x1: 1, x2: 2, y: 1.5 },
        { x1: 1, x2: 2, y: 1.5 },
      ],
      expectedDiscrete: [],
    },
    {
      description: "should handle a shape with decreasing y-values",
      shape: {
        xs: [0, 1, 2],
        ys: [2, 1, 0],
      },
      expectedRectangles: [
        { x1: 1, x2: 2, y: 1.5 },
        { x1: 0, x2: 1, y: 0.5 },
      ],
      expectedDiscrete: [],
    },
    {
      description: "should handle a shape with equal y-values",
      shape: {
        xs: [0, 1, 2],
        ys: [1, 1, 1],
      },
      expectedRectangles: [],
      expectedDiscrete: [],
    },
    {
      description: "should handle a shape with more than two points",
      shape: {
        xs: [0, 1, 2, 3, 4],
        ys: [1, 2, 3, 2, 1],
      },
      expectedRectangles: [
        { x1: 1, x2: 2, y: 1.5 },
        { x1: 2, x2: 3, y: 2.5 },
        { x1: 2, x2: 3, y: 2.5 },
        { x1: 1, x2: 2, y: 1.5 },
      ],
      expectedDiscrete: [],
    },
  ];

  testCases.forEach(({ description, shape, expectedRectangles }) => {
    it(description, () => {
      expect(convertToRectangles(shape).continuous).toStrictEqual(
        expectedRectangles
      );
    });
  });
});

describe("yTransformContinuous", () => {
  it("should transform a simple shape correctly", () => {
    const shape: XYShape = {
      xs: [0, 1, 2],
      ys: [1, 2, 1],
    };

    const expected = {
      continuous: {
        xs: [1, 1, 2, 2],
        ys: [0, 3, 3, 0],
      },
      discrete: {
        xs: [],
        ys: [],
      },
    };

    const result = yTransformContinuous(shape);
    expect(result.continuous).toEqual(expected.continuous);
    expect(result.discrete).toEqual(expected.discrete);
    expect(getContinuousArea(shape)).toBeCloseTo(
      getContinuousArea(result.continuous)
    );
  });

  it("should handle discrete points correctly", () => {
    const shape: XYShape = {
      xs: [0, 1, 2, 3],
      ys: [1, 1, 2, 2],
    };

    const expected = {
      continuous: {
        xs: [1, 1, 2, 2],
        ys: [0, 1.5, 1.5, 0],
      },
      discrete: {
        xs: [1, 2],
        ys: [1, 2],
      },
    };

    const result = yTransformContinuous(shape);
    expect(result.continuous).toEqual(expected.continuous);
    expect(result.discrete).toEqual(expected.discrete);
    expect(getContinuousArea(shape)).toBeCloseTo(
      getDiscreteArea(result.discrete) + getContinuousArea(result.continuous)
    );
  });

  it("should handle a shape with only discrete points", () => {
    const shape: XYShape = {
      xs: [0, 1, 2],
      ys: [1, 1, 1],
    };

    const expected = {
      continuous: {
        xs: [],
        ys: [],
      },
      discrete: {
        xs: [1],
        ys: [2],
      },
    };

    const result = yTransformContinuous(shape);
    expect(result.continuous).toEqual(expected.continuous);
    expect(result.discrete).toEqual(expected.discrete);
    expect(getContinuousArea(shape)).toBeCloseTo(
      getDiscreteArea(result.discrete)
    );
  });

  it("should handle a complicated shape", () => {
    const shape: XYShape = {
      xs: [0, 1, 2, 3, 4, 5],
      ys: [1, 5, 1, 0, 0, 8],
    };

    const expected = {
      continuous: {
        xs: [0, 0, 1, 1, 5, 5, 8, 8],
        ys: [0, 1, 1, 2, 2, 0.5, 0.5, 0],
      },
      discrete: {
        xs: [],
        ys: [],
      },
    };

    const result = yTransformContinuous(shape);
    expect(result.continuous).toEqual(expected.continuous);
    expect(result.discrete).toEqual(expected.discrete);
    expect(getContinuousArea(shape)).toBeCloseTo(
      getContinuousArea(result.continuous)
    );
  });

  it("should handle an empty shape", () => {
    const shape: XYShape = {
      xs: [],
      ys: [],
    };

    const expected = {
      continuous: {
        xs: [],
        ys: [],
      },
      discrete: {
        xs: [],
        ys: [],
      },
    };

    const result = yTransformContinuous(shape);
    expect(result.continuous).toEqual(expected.continuous);
    expect(result.discrete).toEqual(expected.discrete);
  });
});

describe("yTransformDiscrete", () => {
  it("should handle discrete points correctly", () => {
    const shape: XYShape = {
      xs: [0, 1, 2, 3, 4, 5, 6, 7],
      ys: [1, 1, 2, 2, 1, 3, 0.1, 0.1],
    };

    const expected = {
      xs: [0.1, 1, 2, 3],
      ys: [0.2, 3, 4, 3],
    };

    const result = yTransformDiscrete(shape);
    expect(result).toEqual(expected);
    expect(getDiscreteArea(shape)).toBeCloseTo(getDiscreteArea(result));
  });
});
