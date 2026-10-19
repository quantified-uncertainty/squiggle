import * as Continuous from "../../src/PointSet/Continuous.js";
import { DiscreteShape } from "../../src/PointSet/Discrete.js";
import * as Discrete from "../../src/PointSet/Discrete.js";
import { MixedShape } from "../../src/PointSet/Mixed.js";
import { ContinuousShape } from "../../src/PointSet/Continuous.js";

describe("MixedShape bounds", () => {
  const discrete = new DiscreteShape({
    xyShape: { xs: [1, 2, 3], ys: [0.2, 0.5, 0.3] },
  });
  const continuous = new ContinuousShape({
    xyShape: { xs: [-1, 0, 5], ys: [0, 0.5, 0] },
  });

  test("a discrete-only shape is bounded by its discrete part", () => {
    const shape = new MixedShape({
      continuous: Continuous.empty(),
      discrete,
    });
    expect(shape.minX()).toBe(1);
    expect(shape.maxX()).toBe(3);
  });

  test("a continuous-only shape is bounded by its continuous part", () => {
    const shape = new MixedShape({ continuous, discrete: Discrete.empty() });
    expect(shape.minX()).toBe(-1);
    expect(shape.maxX()).toBe(5);
  });

  test("both parts", () => {
    const shape = new MixedShape({ continuous, discrete });
    expect(shape.minX()).toBe(-1);
    expect(shape.maxX()).toBe(5);
  });
});
