import {
  Distribution,
  resultMap,
  defaultBindings,
  mergeBindings,
} from "../../src/js/index";
import { testRun, testRunPartial } from "./TestHelpers";

function Ok<b>(x: b) {
  return { tag: "Ok", value: x };
}

describe("Simple calculations and results", () => {
  test("mean(normal(5,2))", () => {
    expect(testRun("mean(normal(5,2))")).toEqual({
      tag: "number",
      value: 5,
    });
  });
  test("10+10", () => {
    let foo = testRun("10 + 10");
    expect(foo).toEqual({ tag: "number", value: 20 });
  });
});
describe("Log function", () => {
  test("log(1) = 0", () => {
    let foo = testRun("log(1)");
    expect(foo).toEqual({ tag: "number", value: 0 });
  });
});

describe("Array", () => {
  test("nested Array", () => {
    expect(testRun("[[1]]")).toEqual({
      tag: "array",
      value: [
        {
          tag: "array",
          value: [
            {
              tag: "number",
              value: 1,
            },
          ],
        },
      ],
    });
  });
});

describe("Record", () => {
  test("Return record", () => {
    expect(testRun("{a: 1}")).toEqual({
      tag: "record",
      value: {
        a: {
          tag: "number",
          value: 1,
        },
      },
    });
  });
});

describe("Partials", () => {
  test("Can pass variables between partials and cells", () => {
    let bindings = testRunPartial(`x = 5`);
    let bindings2 = testRunPartial(`y = x + 2`, bindings);
    expect(testRun(`y + 3`, bindings2)).toEqual({
      tag: "number",
      value: 10,
    });
  });
  test("Can merge bindings from three partials", () => {
    let bindings1 = testRunPartial(`x = 1`);
    let bindings2 = testRunPartial(`y = 2`);
    let bindings3 = testRunPartial(`z = 3`);
    expect(
      testRun(`x + y + z`, mergeBindings([bindings1, bindings2, bindings3]))
    ).toEqual({
      tag: "number",
      value: 6,
    });
  });
});

describe("JS Imports", () => {
  test("Can pass parameters into partials and cells", () => {
    let bindings = testRunPartial(`y = $x + 2`, defaultBindings, { x: 1 });
    let bindings2 = testRunPartial(`z = y + $a`, bindings, { a: 3 });
    expect(testRun(`z`, bindings2)).toEqual({
      tag: "number",
      value: 6,
    });
  });
  test("Complicated deep parameters", () => {
    expect(
      testRun(`$x.y[0][0].w + $x.z + $u.v`, defaultBindings, {
        x: { y: [[{ w: 1 }]], z: 2 },
        u: { v: 3 },
      })
    ).toEqual({
      tag: "number",
      value: 6,
    });
  });
});

describe("Distribution", () => {
  //It's important that sampleCount is less than 9. If it's more, than that will create randomness
  //Also, note, the value should be created using makeSampleSetDist() later on.
  let env = { sampleCount: 8, xyPointLength: 100 };
  let dist1Samples = [3, 4, 5, 6, 6, 7, 10, 15, 30];
  let dist1SampleCount = dist1Samples.length;
  let dist = new Distribution(
    { tag: "SampleSet", value: [3, 4, 5, 6, 6, 7, 10, 15, 30] },
    env
  );
  let dist2 = new Distribution(
    { tag: "SampleSet", value: [20, 22, 24, 29, 30, 35, 38, 44, 52] },
    env
  );

  test("mean", () => {
    expect(dist.mean().value).toBeCloseTo(9.5555555);
  });
  test("pdf", () => {
    expect(dist.pdf(5.0).value).toBeCloseTo(0.10499097598222966, 1);
  });
  test("cdf", () => {
    expect(dist.cdf(5.0).value).toBeCloseTo(
      dist1Samples.filter((x) => x <= 5).length / dist1SampleCount,
      1
    );
  });
  test("inv", () => {
    expect(dist.inv(0.5).value).toBeCloseTo(6);
  });
  test("toPointSet", () => {
    expect(
      resultMap(dist.toPointSet(), (r: Distribution) => r.toString())
    ).toEqual(Ok("Point Set Distribution"));
  });
  test("toSparkline", () => {
    expect(dist.toSparkline(20).value).toEqual("▁▁▃▇█▇▄▂▂▂▁▁▁▁▁▂▂▁▁▁");
  });
  test("algebraicAdd", () => {
    expect(
      resultMap(dist.algebraicAdd(dist2), (r: Distribution) =>
        r.toSparkline(20)
      ).value
    ).toEqual(Ok("▁▁▂▄▆████▇▆▄▄▃▃▃▂▁▁▁"));
  });
  test("pointwiseAdd", () => {
    expect(
      resultMap(dist.pointwiseAdd(dist2), (r: Distribution) =>
        r.toSparkline(20)
      ).value
    ).toEqual(Ok("▁▂██▃▃▃▃▄▅▄▃▃▂▂▂▁▁▁▁"));
  });
});
