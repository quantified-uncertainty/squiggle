#!/usr/bin/env node
import { SqProject } from "../index.js";
import { measure } from "../cli/utils.js";

const maxP = 7;

async function main() {
  for (let p = 0; p <= maxP; p++) {
    const size = Math.pow(10, p);
    const project = SqProject.create();
    project.setSource("list", `l = List.upTo(1,${size})`);
    project.run("list");
    project.setSource("map", "l -> map({|x| x})");
    project.setContinues("map", ["list"]);
    const time = await measure(async () => {
      await project.run("map");
    });
    console.log(`1e${p}`, "\t", time);
  }
}

main();
