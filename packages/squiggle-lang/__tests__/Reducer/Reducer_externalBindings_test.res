open Jest
open Reducer_TestHelpers


describe("external bindings", () => {
MySkip.testEvalBindingsToBe(
    "y=1; x+1",
    list{("x", ExpressionValue.EvNumber(1.))},
    "Ok(2)",
)
MySkip.testEvalBindingsToBe(
    // This will go away when we have a proper parser
    // x+1 is an expression not a block!
    // Bindings are done for blocks only
    "x+1",
    list{("x", ExpressionValue.EvNumber(1.))},
    "Error(JS Exception: Error: Undefined symbol x)",
)
MySkip.testEvalToBe("x=1; y=1", "???")
})