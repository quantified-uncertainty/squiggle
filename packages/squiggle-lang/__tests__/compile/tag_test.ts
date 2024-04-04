import { testCompile, testCompileEnd } from "../helpers/compileHelpers.js";

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

  // referencing variables in tags
  testCompile(
    `
    n = "X"
    @name(n)
    x=5
    `,
    ['(Assign n "X")', "(Assign x (Call Tag.name 5 (StackRef 0)))"]
  );

  testCompile(
    `
    n = "X"
    d = "D"
    d2 = "oc"
    y = 5
    @name(n)
    @doc(d + d2)
    x = y + 6
    `,
    [
      '(Assign n "X")',
      '(Assign d "D")',
      '(Assign d2 "oc")',
      "(Assign y 5)",
      `(Assign
  x
  (Call
    Tag.name
    (Call
      Tag.doc
      (Call
        add
        (StackRef 0)
        6
      )
      (Call
        add
        (StackRef 2)
        (StackRef 1)
      )
    )
    (StackRef 3)
  )
)`,
    ],
    { pretty: true }
  );
});
