#!/usr/bin/env node
import { SqProject } from "@quri/squiggle-lang";

const project = SqProject.create();

const src = process.argv[2];
if (!src) {
  throw new Error("Expected src");
}
console.log(`Running ${src}`);
project.setSource("a", src);
project.run("a");

const result = project.getResult("a");
console.log(result.tag, result.value.toString());

const bindings = project.getBindings("a");
console.log(bindings.asValue().toString());
