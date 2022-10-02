#!/usr/bin/env node
import { run } from "./lib.mjs";

const src = process.argv[2];
if (!src) {
  throw new Error("Expected src");
}
console.log(`Running ${src}`);

const sampleCount = process.env.SAMPLE_COUNT;

run(src, { output: true, sampleCount });
