open Jest
open Expect
let {eval} = module(Parser_Squiggle)

describe("expressions of normal distributions:", () => {
  test("sum of two", () => {
    expect(eval(" normal (5 , 2 ) + normal(0,2)")) -> toEqual({mean: 5.0 +. 0.0, stdev: Js.Math.sqrt(2.0 ** 2.0 +. 2.0 ** 2.0)} -> #Normal -> Symbolic -> EvDistribution -> Ok -> Some)
  })
  test("difference of two", () => {
    expect(eval("normal(5,3)-normal(2,1)")) -> toEqual({mean: 5.0 -. 2.0, stdev: Js.Math.sqrt(3.0 ** 2.0 +. 1.0 ** 2.0)} -> #Normal -> Symbolic -> EvDistribution -> Ok -> Some)
  })
})
