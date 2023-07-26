#!/usr/bin/env node
import { SqProject } from "../index.js";
import { measure } from "../cli/utils.js";

const maxP = 5;

async function main() {
  for (let p = 0; p <= maxP; p++) {
    const size = Math.pow(10, p);
    const project = SqProject.create();
    project.setSource(
      "main",
      `List.upTo(1, ${size}) -> map({|x| List.upTo(1, 100) -> reduce(0, {|a,b|a+b})})`
    );
    const time = await measure(async () => {
      await project.run("main");
    });
    console.log(`1e${p}`, "\t", time);
  }
}

main();
