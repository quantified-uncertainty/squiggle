import { run, GenericDist, resultMap } from "../src/js/index";

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
  let dist = new GenericDist(
    { tag: "SampleSet", value: [3, 4, 5, 6, 6, 7, 10, 15, 30] },
    { sampleCount: 100, xyPointLength: 100 }
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
});
