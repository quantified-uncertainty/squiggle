open Jest
open Reducer_TestHelpers

describe("Math Library", () => {
  testEvalToBe("Math.e", "Ok(2.718281828459045)")
  testEvalToBe("Math.pi", "Ok(3.141592653589793)")
})
