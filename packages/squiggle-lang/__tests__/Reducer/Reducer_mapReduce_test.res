open Jest
open Reducer_TestHelpers

Skip.describe("map reduce (sam)", () => {
  testEvalToBe("addone(x)=x+1; map(2, addone)", "Error???")
  testEvalToBe("addone(x)=x+1; map(2, {x: addone})", "Error???")
})
