#!/usr/bin/env node
import { SqProject } from "../src";
import { measure } from "../src/cli/utils";

const maxP = 7;

for (let p = 0; p <= maxP; p++) {
  const size = Math.pow(10, p);
  const project = SqProject.create();
  project.setSource("list", `l = List.upTo(1,${size})`);
  project.run("list");
  project.setSource("map", "l |> map({|x| x})");
  project.setContinues("map", ["list"]);
  const time = measure(() => {
    project.run("map");
  });
  console.log(`1e${p}`, "\t", time);
}
