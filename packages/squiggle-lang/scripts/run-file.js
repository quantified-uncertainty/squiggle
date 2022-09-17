#!/usr/bin/env node
const s = require("@quri/squiggle-lang");
const fs = require("fs");

const measure = (cb, times = 1) => {
  const t1 = new Date();

  for (let i = 1; i <= times; i++) {
    cb();
  }
  const t2 = new Date();
  return (t2 - t1) / 1000;
};

const project = s.SqProject.create();
const sampleCount = process.env.SAMPLE_COUNT;
if (sampleCount) {
  project.setEnvironment({
    sampleCount,
    xyPointLength: sampleCount,
  });
}

const src = fs.readFileSync(process.argv[2], "utf-8");
if (!src) {
  throw new Error("Expected src");
}
console.log(`Running ${src}`);
project.setSource("a", src);

const t = measure(() => project.run("a"));
console.log(`Time: ${t}`);

const result = project.getResult("a");
console.log("Result:", result.tag, result.value.toString());

const bindings = project.getBindings("a");
console.log("Bindings:", bindings.toString());
