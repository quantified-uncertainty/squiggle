import { testCompile } from "../helpers/compileHelpers.js";

describe("Compiling unary operators", () => {
  testCompile("a = [3,4]; -a[0]", [
    "(Assign a (Array 3 4))",
    "(Call unaryMinus (Call $_atIndex_$ (StackRef 0) 0))",
  ]);
});
