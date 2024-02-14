import { testCompileEnd } from "../helpers/compileHelpers.js";

describe("Compile tags operator", () => {
  // single decorator
  testCompileEnd(
    `
    @hide
    x=5
    `,
    "(Assign x (Call Tag.hide 5))"
  );

  // multiple tags and application order
  testCompileEnd(
    `
    @hide
    @location
    x=5
    `,
    "(Assign x (Call Tag.hide (Call Tag.location 5)))"
  );

  // with parameters
  testCompileEnd(
    `
    @name("X")
    @doc("Doc")
    x=5
    `,
    '(Assign x (Call Tag.name (Call Tag.doc 5 "Doc") "X"))'
  );
});
