#!/usr/bin/env node
import { SqProject } from "@quri/squiggle-lang";
import fs from "fs";

import { Command } from "commander";

const measure = (cb, times = 1) => {
  const t1 = new Date();

  for (let i = 1; i <= times; i++) {
    cb();
  }
  const t2 = new Date();
  return (t2 - t1) / 1000;
};

<<<<<<< HEAD
const red = (s) => `\x1b[31m${s}\x1b[0m`;
const green = (s) => `\x1b[32m${s}\x1b[0m`;

const program = new Command();

program.option("-t, --time");
=======
const red = (str) => `\x1b[31m${str}\x1b[0m`;
const green = (str) => `\x1b[32m${str}\x1b[0m`;

const program = new Command();

>>>>>>> develop
program.option("-o, --output");
program.arguments("<string>");

const options = program.parse(process.argv);

const project = SqProject.create();
const sampleCount = process.env.SAMPLE_COUNT;
if (sampleCount) {
  project.setEnvironment({
    sampleCount: Number(sampleCount),
    xyPointLength: Number(sampleCount),
  });
}

const src = fs.readFileSync(program.args[0], "utf-8");
if (!src) {
  throw new Error("Expected src");
}

project.setSource("main", src);
<<<<<<< HEAD
const t = measure(() => project.run("main"));
=======
const time = measure(() => project.run("main"));
>>>>>>> develop

const bindings = project.getBindings("main");
const result = project.getResult("main");

if (options.output) {
  console.log("Result:", result.tag, result.value.toString());
  console.log("Bindings:", bindings.toString());
}

<<<<<<< HEAD
if (options.time) {
  console.log(
    "Time:",
    String(t),
    result.tag === "Error" ? red(result.tag) : green(result.tag),
    result.tag === "Error" ? result.value.toString() : ""
  );
}
=======
console.log(
  "Time:",
  String(time),
  result.tag === "Error" ? red(result.tag) : green(result.tag),
  result.tag === "Error" ? result.value.toString() : ""
);
>>>>>>> develop
