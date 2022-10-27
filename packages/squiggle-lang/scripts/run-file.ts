#!/usr/bin/env node
import fs from "fs";

import { Command } from "@commander-js/extra-typings";

import { run } from "./lib";

const program = new Command().arguments("<string>").option("-o, --output");

program.parse(process.argv);
const options = program.opts();

const sampleCount = process.env.SAMPLE_COUNT;

const src = fs.readFileSync(program.args[0], "utf-8");
if (!src) {
  throw new Error("Expected src");
}

run(src, { output: options.output, sampleCount });
