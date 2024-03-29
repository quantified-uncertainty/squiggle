import { testCompile, testCompileEnd } from "../helpers/compileHelpers.js";

describe("Compile dicts", () => {
  testCompileEnd("{a: 1, b: 2}", '(Dict (kv "a" 1) (kv "b" 2))');

  // expressions in keys
  testCompileEnd(
    "{1+0: 1, 2+0: 2}",
    "(Dict (kv (Call add 1 0) 1) (kv (Call add 2 0) 2))"
  );

  testCompileEnd("dict.property", "Error(dict is not defined)");

  testCompile("dict={property: 1}; dict.property", [
    '(Assign dict (Dict (kv "property" 1)))',
    '(Call #indexLookup (StackRef 0) "property")',
  ]);
});
