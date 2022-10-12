#!/usr/bin/env node
import { run } from "./lib.mjs";

import { Command } from "commander";

const program = new Command();

program.arguments("<string>");

const options = program.parse(process.argv);

const src = program.args[0];
if (!src) {
  throw new Error("Expected src");
}

const sampleCount = process.env.SAMPLE_COUNT;

run(src, { output: true, sampleCount });
