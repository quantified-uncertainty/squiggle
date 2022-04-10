import { run, GenericDist, resultMap, makeSampleSetDist } from "../src/js/index";

let testRun = (x: string) => {
  let result = run(x);
  if (result.tag == "Ok") {
    return { tag: "Ok", value: result.value.exports };
  } else {
    return result;
  }
};

describe("Simple calculations and results", () => {
  test("mean(normal(5,2))", () => {
    expect(testRun("mean(normal(5,2))")).toEqual({
      tag: "Ok",
      value: [{ NAME: "Float", VAL: 5 }],
    });
  });
  test("10+10", () => {
    let foo = testRun("10 + 10");
    expect(foo).toEqual({ tag: "Ok", value: [{ NAME: "Float", VAL: 20 }] });
  });
});
describe("Log function", () => {
  test("log(1) = 0", () => {
    let foo = testRun("log(1)");
    expect(foo).toEqual({ tag: "Ok", value: [{ NAME: "Float", VAL: 0 }] });
  });
});

describe("Multimodal too many weights error", () => {
  test("mm(0,0,[0,0,0])", () => {
    let foo = testRun("mm(0,0,[0,0,0])");
    expect(foo).toEqual({
      tag: "Error",
      value: "Function multimodal error: Too many weights provided",
    });
  });
});

describe("GenericDist", () => {

  //It's important that sampleCount is less than 9. If it's more, than that will create randomness
  //Also, note, the value should be created using makeSampleSetDist() later on.
  let env = { sampleCount: 8, xyPointLength: 100 };
  let dist = new GenericDist(
    { tag: "SampleSet", value: [3, 4, 5, 6, 6, 7, 10, 15, 30] },
    env
  );
  let dist2 = new GenericDist(
    { tag: "SampleSet", value: [20, 22, 24, 29, 30, 35, 38, 44, 52] },
    env
  );

  test("mean", () => {
    expect(dist.mean().value).toBeCloseTo(3.737);
  });
  test("pdf", () => {
    expect(dist.pdf(5.0).value).toBeCloseTo(0.0431);
  });
  test("cdf", () => {
    expect(dist.cdf(5.0).value).toBeCloseTo(0.155);
  });
  test("inv", () => {
    expect(dist.inv(0.5).value).toBeCloseTo(9.458);
  });
  test("toPointSet", () => {
    expect(
      resultMap(dist.toPointSet(), (r: GenericDist) => r.toString()).value.value
    ).toBe("Point Set Distribution");
  });
  test("toSparkline", () => {
    expect(dist.toSparkline(20).value).toBe("▁▁▃▅███▆▄▃▂▁▁▂▂▃▂▁▁▁");
  });
  test("algebraicAdd", () => {
    expect(
      resultMap(dist.algebraicAdd(dist2), (r: GenericDist) => r.toSparkline(20))
        .value.value
    ).toBe("▁▁▂▄▆████▇▆▄▄▃▃▃▂▁▁▁");
  });
  test("pointwiseAdd", () => {
    expect(
      resultMap(dist.pointwiseAdd(dist2), (r: GenericDist) => r.toSparkline(20))
        .value.value
    ).toBe("▁▂▅██▅▅▅▆▇█▆▅▃▃▂▂▁▁▁");
  });
});
