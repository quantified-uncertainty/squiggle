import { testCompileEnd } from "../helpers/compileHelpers.js";

describe("Compile Array", () => {
  // basic array
  testCompileEnd("[1,2]", "(Array 1 2)");
  // string array
  testCompileEnd("['hello', 'world']", '(Array "hello" "world")');
  // empty array
  testCompileEnd("[]", "(Array)");

  // array with stack refs
  testCompileEnd("f(x)=x; g(x)=x; [f, g]", "(Array (StackRef 1) (StackRef 0))");
});
