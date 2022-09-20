#!/usr/bin/env node
import { run } from "./lib.mjs";

const src = process.argv[2];
if (!src) {
  throw new Error("Expected src");
}
console.log(`Running ${src}`);

run(src);
