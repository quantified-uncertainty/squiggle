import { PointSetDist } from "../../src/dists/PointSetDist.js";
import { SampleSetDist } from "../../src/dists/SampleSetDist/index.js";
import { Normal } from "../../src/dists/SymbolicDist/Normal.js";
import { ContinuousShape } from "../../src/PointSet/Continuous.js";
import { DiscreteShape } from "../../src/PointSet/Discrete.js";
import { MixedShape } from "../../src/PointSet/Mixed.js";
import {
  tDist,
  tPointSetDist,
  tSampleSetDist,
  tSymbolicDist,
} from "../../src/types/index.js";
import { vDist } from "../../src/value/index.js";

describe("pack/unpack", () => {
  test("base", () => {
    const dResult = Normal.make({ mean: 2, stdev: 5 });
    if (!dResult.ok) {
      throw new Error();
    }
    const dist = dResult.value;
    const value = vDist(dist);
    expect(tDist.unpack(value)).toBe(dist);
    expect(tDist.pack(dist)).toEqual(value);
  });

  test("symbolicDist", () => {
    const dResult = Normal.make({ mean: 2, stdev: 5 });
    if (!dResult.ok) {
      throw new Error();
    }
    const dist = dResult.value;
    const value = vDist(dist);
    expect(tSymbolicDist.unpack(value)).toBe(dist);
    expect(tSymbolicDist.pack(dist)).toEqual(value);
  });

  test("sampleSetDist", () => {
    const dResult = SampleSetDist.make([1, 2, 3, 4, 2, 1, 2, 3, 4, 5, 3, 4]);
    if (!dResult.ok) {
      throw new Error();
    }
    const dist = dResult.value;
    const value = vDist(dist);
    expect(tSampleSetDist.unpack(value)).toBe(dist);
    expect(tSampleSetDist.pack(dist)).toEqual(value);
  });

  test("pointSetDist", () => {
    const dist = new PointSetDist(
      new MixedShape({
        continuous: new ContinuousShape({ xyShape: { xs: [], ys: [] } }),
        discrete: new DiscreteShape({ xyShape: { xs: [], ys: [] } }),
      })
    );
    const value = vDist(dist);
    expect(tPointSetDist.unpack(value)).toBe(dist);
    expect(tPointSetDist.pack(dist)).toEqual(value);
  });
});
