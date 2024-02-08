import { testCompileEnd } from "../helpers/compileHelpers.js";

describe("Compiling plain values", () => {
  testCompileEnd("1", "1");
  testCompileEnd("'hello'", '"hello"');
  testCompileEnd("true", "true");
  testCompileEnd("(1)", "1");

  // builtin names come from externals and are inlined
  testCompileEnd("add", "add");
  testCompileEnd("Math.pi", "3.141592653589793");

  testCompileEnd("nosuchvalue", "Error(nosuchvalue is not defined)");
});
