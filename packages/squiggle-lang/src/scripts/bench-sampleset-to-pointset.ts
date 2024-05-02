#!/usr/bin/env node
import { measure } from "../cli/utils.js";
import { defaultEnv } from "../dists/env.js";
import { SqProject } from "../index.js";

const maxP = 4;

const sampleCount = process.env["SAMPLE_COUNT"];
const seed = process.env["SEED"];

async function main() {
  for (let p = 0; p <= maxP; p++) {
    const size = Math.pow(10, p);
    const project = SqProject.create({
      environment: {
        sampleCount: Number(sampleCount ?? defaultEnv.sampleCount),
        xyPointLength: Number(sampleCount ?? defaultEnv.xyPointLength),
        seed: seed || "default-seed",
      },
    });
    project.setSource(
      "main",
      `
    List.upTo(1, ${size}) -> map(
      { |x| normal(x,2) -> SampleSet.fromDist -> PointSet.fromDist }
    )->List.last
    `
    );
    const time = await measure(async () => {
      await project.run("main");
    });
    const result = project.getResult("main");
    if (!result.ok) {
      throw new Error("Code failed: " + result.value.toString());
    }
    console.log(`1e${p}`, "\t", time);
  }
}

main();
