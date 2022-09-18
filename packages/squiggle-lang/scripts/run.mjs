#!/usr/bin/env node
import { SqProject } from "@quri/squiggle-lang";

const p = SqProject.create();

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
console.log(bindings.asValue().toString());
