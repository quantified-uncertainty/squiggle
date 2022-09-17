open Jest
open Reducer_TestHelpers

describe("Parse function assignment", () => {
  testParseToBe(
    "f(x)=x",
    "Ok(f = {|x| {x}})"
  )
  testParseToBe(
    "f(x)=2*x",
    "Ok(f = {|x| {(multiply)(2, x)}})"
  )
  //MathJs does not allow blocks in function definitions
})

describe("Evaluate function assignment", () => {
  testEvalToBe("f(x)=x; f(1)", "Ok(1)")
})
