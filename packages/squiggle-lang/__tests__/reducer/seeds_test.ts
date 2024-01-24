import { SqProject } from "../../src/index.js";

const SAMPLE_COUNT = 100;

async function getSamplesForSeed(seed?: string | undefined) {
  const project = new SqProject({
    environment: {
      sampleCount: SAMPLE_COUNT,
      xyPointLength: 100,
      seed,
    },
  });
  project.setSource("main", "2 to 3");
  await project.run("main");
  const result = project.getResult("main");
  if (!result.ok) {
    throw new Error("Run failed");
  }
  const samples = result.value.asJS();
  if (!Array.isArray(samples)) {
    throw new Error("Expected an array");
  }
  return samples as number[];
}

describe("seeds", () => {
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

  test("Sample sets without explcit seeds are different", async () => {
    const samples = await getSamplesForSeed();
    expect(samples.length).toEqual(SAMPLE_COUNT);

    const samples2 = await getSamplesForSeed();
    expect(samples).not.toEqual(samples2);
  });
});
