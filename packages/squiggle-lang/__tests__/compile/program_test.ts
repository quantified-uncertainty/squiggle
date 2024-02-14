import { testCompile } from "../helpers/compileHelpers.js";

describe("Compiling simple programs", () => {
  testCompile("1", "(Program (.statements 1))", { mode: "full" });

  // Assignment and .bindings
  testCompile("x=1", "(Program (.statements (Assign x 1)) (.bindings (x 0)))", {
    mode: "full",
  });

  // Multiple assignments and .bindings
  testCompile(
    "x=1; y=2",
    "(Program (.statements (Assign x 1) (Assign y 2)) (.bindings (x 1) (y 0)))",
    { mode: "full" }
  );

  // End expressions
  testCompile(
    "x=1; 2",
    "(Program (.statements (Assign x 1) 2) (.bindings (x 0)))",
    { mode: "full" }
  );

  // Stack refs in end expressions
  testCompile(
    "x=5; x",
    "(Program (.statements (Assign x 5) (StackRef 0)) (.bindings (x 0)))",
    { mode: "full" }
  );
  testCompile(
    "x=5; y=6; x+y",
    "(Program (.statements (Assign x 5) (Assign y 6) (Call add (StackRef 1) (StackRef 0))) (.bindings (x 1) (y 0)))",
    { mode: "full" }
  );

  // Stack refs in assignments
  testCompile(
    "x=5; y=6; z=x+y",
    "(Program (.statements (Assign x 5) (Assign y 6) (Assign z (Call add (StackRef 1) (StackRef 0)))) (.bindings (x 2) (y 1) (z 0)))",
    { mode: "full" }
  );

  testCompile(
    "x={a=1; a}; x",
    "(Program (.statements (Assign x (Block (Assign a 1) (StackRef 0))) (StackRef 0)) (.bindings (x 0)))",
    { mode: "full" }
  );

  testCompile("x", "Error(x is not defined)");
});
