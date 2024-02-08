import { testCompileEnd } from "../helpers/compileHelpers.js";

describe("Compile ternary operator", () => {
  testCompileEnd("true ? 'YES' : 'NO'", '(Ternary true "YES" "NO")');

  testCompileEnd(
    "x = 1; y = 2; true ? x : y",
    "(Ternary true (StackRef 1) (StackRef 0))"
  );

  testCompileEnd(
    "true ? 1 : false ? 2 : 0",
    "(Ternary true 1 (Ternary false 2 0))"
  );
});
