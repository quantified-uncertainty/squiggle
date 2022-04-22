open Jest
open Reducer_TestHelpers

Skip.describe("Parse ternary operator", () => {
  testParseToBe("true ? 'YES' : 'NO'", "Ok('YES')")
  testParseToBe("false ? 'YES' : 'NO'", "Ok('NO')")
})

Skip.describe("Evaluate ternary operator", () => {
  testEvalToBe("true ? 'YES' : 'NO'", "Ok('YES')")
  testEvalToBe("false ? 'YES' : 'NO'", "Ok('NO')")
})
