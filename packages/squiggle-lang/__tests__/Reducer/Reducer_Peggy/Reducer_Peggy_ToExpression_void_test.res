open Jest
open Reducer_Peggy_TestHelpers

describe("Peggy void", () => {
  //literal
  testToExpression("()", "()", ~v="()", ())
  testToExpression(
    "fn()=1",
    "fn = {|_| {1}}",
    // ~v="@{fn: lambda(_=>internal code)}",
    (),
  )
  testToExpression("fn()=1; fn()", "fn = {|_| {1}}; (fn)(())", ~v="1", ())
  testToExpression(
    "fn(a)=(); call fn(1)",
    "fn = {|a| {()}}; _ = {(fn)(1)}",
    // ~v="@{_: (),fn: lambda(a=>internal code)}",
    (),
  )
})
