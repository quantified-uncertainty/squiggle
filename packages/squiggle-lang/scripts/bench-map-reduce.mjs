#!/usr/bin/env node
import { SqProject } from "@quri/squiggle-lang";

const measure = (cb, times = 1) => {
  const t1 = new Date();

  for (let i = 1; i <= times; i++) {
    cb();
  }
  const t2 = new Date();
  return (t2 - t1) / 1000;
};

const maxP = 5;

for (let p = 0; p <= maxP; p++) {
  const size = Math.pow(10, p);
  const project = SqProject.create();
  project.setSource(
    "main",
    `List.upTo(1, ${size}) |> map({|x| List.upTo(1, 100) |> reduce(0, {|a,b|a+b})})`
  );
  const time = measure(() => {
    project.run("main");
  });
  console.log(`1e${p}`, "\t", time);
}
