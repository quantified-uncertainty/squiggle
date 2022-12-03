#!/usr/bin/env node
import { SqProject } from "../src";
import { measure } from "../src/cli/utils";

const maxP = 4;

const sampleCount = process.env.SAMPLE_COUNT;

for (let p = 0; p <= maxP; p++) {
  const size = Math.pow(10, p);
  const project = SqProject.create();
  if (sampleCount) {
    project.setEnvironment({
      sampleCount: Number(sampleCount),
      xyPointLength: Number(sampleCount),
    });
  }
  project.setSource(
    "main",
    `
    List.upTo(1, ${size}) -> map(
      { |x| normal(x,2) -> SampleSet.fromDist -> PointSet.fromDist }
    )->List.last
    `
  );
  const time = measure(() => {
    project.run("main");
  });
  const result = project.getResult("main");
  if (!result.ok) {
    throw new Error("Code failed: " + result.value.toString());
  }
  console.log(`1e${p}`, "\t", time);
}
