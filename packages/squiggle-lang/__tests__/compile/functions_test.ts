import { testCompile, testCompileEnd } from "../helpers/compileHelpers.js";

describe("Compile functions", () => {
  testCompileEnd("{|x| x}", "(Lambda (.parameters x) (StackRef 0))");
  testCompileEnd(
    "f={|x| x}",
    "(Assign f (Lambda (.parameters x) (StackRef 0)))"
  );

  // Function definitions are lambda assignments
  testCompileEnd("f(x)=x", "(Assign f (Lambda (.parameters x) (StackRef 0)))");

  testCompile("identity(x)", "Error(identity is not defined)"); // Note value returns error properly

  // Captures
  testCompile(
    "f=99; g(x)=f; g(2)",
    `(Program
  (.statements
    (Assign f 99)
    (Assign
      g
      (Lambda
        (.captures
          (StackRef 0)
        )
        (.parameters x)
        (CaptureRef 0)
      )
    )
    (Call
      (StackRef 0)
      2
    )
  )
  (.bindings
    (f 1)
    (g 0)
  )
)`,
    { pretty: true, mode: "full" }
  );

  // https://github.com/quantified-uncertainty/squiggle/issues/3141;
  // check that annotations are referenced by stack, not captured
  testCompile(
    "foo = [1,5]; fn(x:foo) = x",
    [
      "(Assign foo (Array 1 5))",
      "(Assign fn (Lambda (.parameters (.annotated x (StackRef 0))) (StackRef 0)))",
    ],
    { mode: "statements" }
  );
});
