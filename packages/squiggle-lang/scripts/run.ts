#!/usr/bin/env node
import { run } from "./lib";

import { Command } from "@commander-js/extra-typings";

const program = new Command().arguments("<string>");

const options = program.parse(process.argv);

const src = program.args[0];
if (!src) {
  throw new Error("Expected src");
}

const sampleCount = process.env.SAMPLE_COUNT;

run(src, { output: true, sampleCount });
