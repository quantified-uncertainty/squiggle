#!/usr/bin/env node
const s = require("./dist/src/js");

const measure = (cb, times = 1) => {
  const t1 = new Date();

  for (let i = 1; i <= times; i++) {
    cb();
  }
  const t2 = new Date();
  return (t2 - t1) / 1000;
};

const maxP = 7;

for (let p = 0; p <= maxP; p++) {
  const size = Math.pow(10, p);
  const prj = s.SqProject.create();
  prj.setSource("list", `l = List.upTo(1,${size})`);
  prj.run("list");
  prj.setSource("map", "l |> map({|x| x})");
  prj.setContinues("map", ["list"]);
  const t = measure(() => {
    prj.run("map");
  });
  console.log(`1e${p}`, "\t", t);
}
