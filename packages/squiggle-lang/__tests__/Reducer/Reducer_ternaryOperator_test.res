open Jest
open Reducer_TestHelpers

describe("Parse ternary operator", () => {
  testParseToBe("true ? 'YES' : 'NO'", "Ok((:$$block (:$$ternary true 'YES' 'NO')))")
})

describe("Evaluate ternary operator", () => {
  testEvalToBe("true ? 'YES' : 'NO'", "Ok('YES')")
  testEvalToBe("false ? 'YES' : 'NO'", "Ok('NO')")
  testEvalToBe("2 > 1 ? 'YES' : 'NO'", "Ok('YES')")
  testEvalToBe("2 <= 1 ? 'YES' : 'NO'", "Ok('NO')")
  testEvalToBe("1+1 ? 'YES' : 'NO'", "Error(Expected type: Boolean)")
})
