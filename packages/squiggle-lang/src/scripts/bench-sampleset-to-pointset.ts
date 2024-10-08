#!/usr/bin/env node
import { measure } from "../cli/utils.js";
import { defaultEnv } from "../dists/env.js";
import { SqModuleOutput } from "../public/SqProject/SqModuleOutput.js";
import { run } from "../run.js";

const maxP = 4;

const sampleCount = process.env["SAMPLE_COUNT"];
const seed = process.env["SEED"];

async function main() {
  for (let p = 0; p <= maxP; p++) {
    const size = Math.pow(10, p);
    let result: SqModuleOutput | undefined;
    const time = await measure(async () => {
      result = await run(
        `
    List.upTo(1, ${size}) -> map(
      { |x| normal(x,2) -> SampleSet.fromDist -> PointSet.fromDist }
    )->List.last
        `,
        {
          environment: {
            sampleCount: Number(sampleCount ?? defaultEnv.sampleCount),
            xyPointLength: Number(sampleCount ?? defaultEnv.xyPointLength),
            seed: seed || "default-seed",
          },
        }
      );
    });
    if (!result?.result.ok) {
      throw new Error("Code failed: " + result?.result.value.toString());
    }
    console.log(`1e${p}`, "\t", time);
  }
}

main();
