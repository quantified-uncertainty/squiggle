#!/usr/bin/env node
import fs from "fs";

import { Command } from "commander";

import { SqProject } from "@quri/squiggle-lang";
import { runProject } from "./lib.mjs";

const program = new Command();

program.option("-o, --output");
program.arguments("<string>");

const options = program.parse(process.argv);

const sampleCount = process.env.SAMPLE_COUNT;
console.log(sampleCount);

const src = fs.readFileSync(program.args[0], "utf-8");
if (!src) {
  throw new Error("Expected src");
}

const projectJson = JSON.parse(src);

const project = SqProject.fromJson(projectJson);

runProject(project, options);
