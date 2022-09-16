#!/usr/bin/env node
const s = require("@quri/squiggle-lang");

const p = s.SqProject.create();

const src = process.argv[2];
if (!src) {
  throw new Error("Expected src");
}
console.log(`Running ${src}`);
p.setSource("a", src);
p.run("a");

const result = p.getResult("a");
console.log(result.tag, result.value.toString());

const bindings = p.getBindings("a");
console.log(bindings.toString());
