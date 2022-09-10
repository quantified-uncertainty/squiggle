#!/usr/bin/env node
const s = require("./dist/src/js");
const fs = require("fs");

const measure = (cb, times = 1) => {
  const t1 = new Date();

  for (let i = 1; i <= times; i++) {
    cb();
  }
  const t2 = new Date();
  return (t2 - t1) / 1000;
};

const maxP = 0;

const bioSrc = fs.readFileSync(
  "/Users/berekuk/Downloads/Bio.squiggle",
  "utf-8"
);

for (let p = 0; p <= maxP; p++) {
  const size = Math.pow(10, p);
  const prj = s.SqProject.create();
  prj.setSource("main", bioSrc);
  const t = measure(() => {
    prj.run("main");
  });
  console.log(`1e${p}`, "\t", t);
}
