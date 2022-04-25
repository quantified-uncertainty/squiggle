open Jest
open Reducer_TestHelpers

describe("Parse ternary operator", () => {
  testParseToBe("true ? 'YES' : 'NO'", "Ok((:$$ternary true 'YES' 'NO'))")
  testParseToBe("2>1 ? 'YES' : 'NO'", "Ok((:$$ternary (:larger 2 1) 'YES' 'NO'))")
})

Skip.describe("Evaluate ternary operator", () => {
  testEvalToBe("true ? 'YES' : 'NO'", "Ok('YES')")
  testEvalToBe("false ? 'YES' : 'NO'", "Ok('NO')")
})
