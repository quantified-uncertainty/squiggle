#!/usr/bin/env node
import { defaultEnv } from "../dists/env.js";
import { makeSelfContainedLinker } from "../public/SqLinker.js";
import { SqProject } from "../public/SqProject/index.js";

const maxP = 7;

async function main() {
  for (let p = 0; p <= maxP; p++) {
    const size = Math.pow(10, p);
    const linker = makeSelfContainedLinker({
      list: `export l = List.upTo(1,${size})`,
      map: `
import "list" as list
list.l -> map({|x| x})
`,
    });
    const project = new SqProject({
      linker,
      rootSource: await linker.loadModule("map"),
      environment: defaultEnv,
    });
    const result = await project.runRoot();
    console.log(`1e${p}`, "\t", result.executionTime / 1000);
  }
}

main();
