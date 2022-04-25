open Jest
open Reducer_TestHelpers

describe("Parse ternary operator", () => {
  testParseToBe("true ? 'YES' : 'NO'", "Ok((:$$ternary true 'YES' 'NO'))")
  testParseToBe("2>1 ? 'YES' : 'NO'", "Ok((:$$ternary (:larger 2 1) 'YES' 'NO'))")
  MyOnly.testParseToBe(
    "x = true; x ? 'YES' : 'NO' in x",
    "Ok((:$$bindExpression (:$$bindStatement (:$$bindings) (:$let :x true)) (:$$ternary :x 'YES' (:multiply (:multiply 'NO' :in) :x))))",
  )
})

describe("Evaluate ternary operator", () => {
  testEvalToBe("true ? 'YES' : 'NO'", "Ok('YES')")
  MyOnly.testEvalToBe("x = true; x ? 'YES' : 'NO' in x", "Ok('YES')")
  testEvalToBe("false ? 'YES' : 'NO'", "Ok('NO')")
})

describe("Evaluate ternary operator in subscope", () => {
  testEvalToBe("x = true ? 'YES' : 'NO' in x", "Ok('YES')")
})
