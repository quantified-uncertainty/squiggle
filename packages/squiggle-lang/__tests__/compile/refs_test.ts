import { testCompile } from "../helpers/compileHelpers.js";

describe("References in compiled expressions", () => {
  // inner blocks are 0 argument lambdas. They can be used whenever a value is required.
  // Like lambdas they have a local scope.
  testCompile("y=99; x={y=1; y}", [
    "(Assign y 99)",
    "(Assign x (Block (Assign y 1) (StackRef 0)))",
  ]);
});
