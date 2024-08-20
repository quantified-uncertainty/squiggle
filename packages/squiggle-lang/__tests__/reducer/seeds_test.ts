import { SqProject } from "../../src/index.js";

const SAMPLE_COUNT = 100;

async function getSamplesForSeed(seed?: string | undefined) {
  const project = new SqProject({
    environment: {
      sampleCount: SAMPLE_COUNT,
      xyPointLength: 100,
      seed: seed || "default",
    },
  });
  project.setSource("main", "2 to 3");
  await project.run("main");
  const result = project.getResult("main");
  if (!result.ok) {
    throw new Error("Run failed");
  }
  interface ResultValue {
    samples: number[];
  }

  // Assert the type of value.asJS()
  const value = result.value.asJS() as ResultValue;

  // Check if samples exists and is an array
  if (!Array.isArray(value.samples)) {
    throw new Error("Expected samples to be an array");
  }

  return value.samples;
}

describe("seeds", () => {
  // we use Math.random() for now, so this should fail
  test("Sample sets with identical seeds are identical", async () => {
    const samples = await getSamplesForSeed("test");
    expect(samples.length).toEqual(SAMPLE_COUNT);

    const samples2 = await getSamplesForSeed("test");
    expect(samples).toEqual(samples2);
  });

  test("Sample sets with different seeds are different", async () => {
    const samples = await getSamplesForSeed("test");
    expect(samples.length).toEqual(SAMPLE_COUNT);

    const samples2 = await getSamplesForSeed("test2");
    expect(samples).not.toEqual(samples2);
  });
});
