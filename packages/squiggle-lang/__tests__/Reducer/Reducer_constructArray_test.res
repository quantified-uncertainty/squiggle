open Jest
open Reducer_Peggy_TestHelpers

describe("Construct Array", () => {
  testToExpression("[1,2]", "[1, 2]", ~v="[1,2]", ())
  testToExpression("[]", "[]", ~v="[]", ())
  testToExpression(
    "f(x)=x; g(x)=x; [f, g]",
    "f = {|x| {x}}; g = {|x| {x}}; [f, g]",
    ~v="[lambda(x=>internal code),lambda(x=>internal code)]",
    (),
  )
})
