open Jest
open Reducer_TestHelpers

describe("Plot Library", () => {
  testEvalToBe(`Plot.dist({
    show: [{
      name: "normal",
      value: normal(0, 1)
    }, {
      name: "lognormal", 
      value: 1 to 2
    }, {
      name: "constant", 
      value: 3
    }]
})`, "Ok(Plot showing normal,lognormal,constant)")
})
