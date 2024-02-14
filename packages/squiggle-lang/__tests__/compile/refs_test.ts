import { sq } from "../../src/index.js";
import { testCompile } from "../helpers/compileHelpers.js";

describe("References in compiled expressions", () => {
  testCompile("y=99; x={y=1; y}", [
    "(Assign y 99)",
    "(Assign x (Block (Assign y 1) (StackRef 0)))",
  ]);

  // Complex test for nested captures.
  testCompile(
    sq`
x1 = 101 // unused
x2 = 102
x3 = 103

// f1 captures: x3, x2.
f1(p1) = {
  y1 = x3

  // f2 captures: x2, p1, y1.
  // Effect on f1 captures: everything in f2 captures that's not local for f1.
  f2(p2) = {
    z1 = 301

    // p2 is a local parameter (on stack)
    // x2 is captured
    // z1 is local (on stack)
    // p1 is captured
    // y1 is captured
    [p2, x2, z1, p1, y1]
  }
  1
}
  `,
    `(Program
  (.statements
    (Assign x1 101)
    (Assign x2 102)
    (Assign x3 103)
    (Assign
      f1
      (Lambda
        (.captures
          (StackRef 0)
          (StackRef 1)
        )
        (.parameters p1)
        (Block
          (Assign
            y1
            (CaptureRef 0)
          )
          (Assign
            f2
            (Lambda
              (.captures
                (CaptureRef 1)
                (StackRef 1)
                (StackRef 0)
              )
              (.parameters p2)
              (Block
                (Assign z1 301)
                (Array
                  (StackRef 1)
                  (CaptureRef 0)
                  (StackRef 0)
                  (CaptureRef 1)
                  (CaptureRef 2)
                )
              )
            )
          )
          1
        )
      )
    )
  )
  (.bindings
    (x1 3)
    (x2 2)
    (x3 1)
    (f1 0)
  )
)`,
    { mode: "full", pretty: true }
  );
});
