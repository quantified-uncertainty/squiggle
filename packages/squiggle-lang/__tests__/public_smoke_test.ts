import { run, SqProject } from "../src/index.js";
import { testRun } from "./helpers/helpers.js";

describe("Simple calculations and results", () => {
  test("mean(Sym.normal(5,2))", async () => {
    const result = await testRun("mean(Sym.normal(5,2))"); // FIXME
    expect(result.toString()).toEqual("5");
  });
  test("10+10", async () => {
    const result = await testRun("10 + 10");
    expect(result.toString()).toEqual("20");
  });
});
describe("Log function", () => {
  test("log(1) = 0", async () => {
    const foo = await testRun("log(1)");
    expect(foo.toString()).toEqual("0");
  });
});

describe("Array", () => {
  test("nested Array", async () => {
    expect((await testRun("[[ 1 ]]")).toString()).toEqual("[[1]]");
  });
});

describe("Dict", () => {
  test("Return dict", async () => {
    expect((await testRun("{a:1}")).toString()).toEqual("{a: 1}");
  });
});

describe("Continues", () => {
  test("Bindings from continues are accessible", async () => {
    const project = SqProject.create();
    project.setSource("p1", "x = 5");
    project.setSource("p2", "y = x + 2");
    project.setSource("main", "y + 3");
    project.setContinues("main", ["p2"]);
    project.setContinues("p2", ["p1"]);
    await project.run("main");
    const result = project.getResult("main");
    expect(result.ok).toEqual(true);
    expect(result.value.toString()).toEqual("10");
  });
  test("Can merge bindings from three partials", async () => {
    const project = SqProject.create();
    project.setSource("p1", "x = 1");
    project.setSource("p2", "y = 2");
    project.setSource("p3", "z = 3");
    project.setSource("main", "x + y + z");
    project.setContinues("main", ["p1", "p2", "p3"]);
    await project.run("main");
    const result = project.getResult("main");
    expect(result.ok).toEqual(true);
    expect(result.value.toString()).toEqual("6");
  });
});

describe("Distribution", () => {
  //It's important that sampleCount is less than 9. If it's more, than that will create randomness
  //Also, note, the value should be created using makeSampleSetDist() later on.
  const env = { sampleCount: 8, xyPointLength: 100 };
  const dist1Samples = [3, 4, 5, 6, 6, 7, 10, 15, 30];
  const dist1SampleCount = dist1Samples.length;

  const buildDist = async (samples: number[]) => {
    const src = `SampleSet.fromList([${samples.join(",")}])`;
    const output = await run(src, {
      environment: env,
    });
    if (!output.ok) {
      throw new Error(
        `Failed to build SampleSet: from ${src}: ${output.value}`
      );
    }
    const dist = output.value.result;
    if (dist.tag !== "Dist") {
      throw new Error("Expected Distribution");
    }
    return dist.value;
  };

  // const dist2 = buildDist([20, 22, 24, 29, 30, 35, 38, 44, 52]);

  test("mean", async () => {
    const dist = await buildDist(dist1Samples);
    expect(dist.mean(env)).toBeCloseTo(9.5555555);
  });
  test("pdf", async () => {
    const dist = await buildDist(dist1Samples);
    expect(dist.pdf(env, 5.0).value).toBeCloseTo(0.10499097598222966, 1);
  });
  test("cdf", async () => {
    const dist = await buildDist(dist1Samples);
    expect(dist.cdf(env, 5.0).value).toBeCloseTo(
      dist1Samples.filter((x) => x <= 5).length / dist1SampleCount,
      1
    );
  });
  test("inv", async () => {
    const dist = await buildDist(dist1Samples);
    expect(dist.inv(env, 0.5).value).toBeCloseTo(6);
  });
  // test("toPointSet", () => {
  //   expect(
  //     resultMap(dist.toPointSet(), (r: Distribution) => r.toString())
  //   ).toEqual(Ok("Point Set Distribution"));
  // });
  // test("toSparkline", () => {
  //   expect(dist.toSparkline(20).value).toEqual("▁▁▃▇█▇▄▂▂▂▁▁▁▁▁▂▂▁▁▁");
  // });
  // test("algebraicAdd", () => {
  //   expect(
  //     resultMap(dist.algebraicAdd(dist2), (r: Distribution) =>
  //       r.toSparkline(20)
  //     ).value
  //   ).toEqual(Ok("▁▁▂▄▆████▇▆▄▄▃▃▃▂▁▁▁"));
  // });
  // test("pointwiseAdd", () => {
  //   expect(
  //     resultMap(dist.pointwiseAdd(dist2), (r: Distribution) =>
  //       r.toSparkline(20)
  //     ).value
  //   ).toEqual(Ok("▁▂██▃▃▃▃▄▅▄▃▃▂▂▂▁▁▁▁"));
  // });
});
