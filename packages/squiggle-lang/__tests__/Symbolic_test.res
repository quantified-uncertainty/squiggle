open Jest
open Expect
open Js.Array
open SymbolicDist

let makeTest = (~only=false, str, item1, item2) =>
  only
    ? Only.test(str, () => expect(item1) -> toEqual(item2))
    : test(str, () => expect(item1) -> toEqual(item2))

let normalParams1: SymbolicDistTypes.normal = {mean: 5.0, stdev: 2.0}
let normalParams2: SymbolicDistTypes.normal = {mean: 10.0, stdev: 2.0}
let normalParams3: SymbolicDistTypes.normal = {mean: 20.0, stdev: 2.0}
let range20 = [0.0,1.0,2.0,3.0,4.0,5.0,6.0,7.0,8.0,9.0,10.0,11.0,12.0,13.0,14.0,15.0,16.0,17.0,18.0,19.0,20.0]
let forSparkline = (thisPdf, inps) => map(thisPdf, inps)

describe("normal combine", () => {
  let pdf1 = x => Normal.pdf(x, normalParams1)
  let forSparkline1 = forSparkline(pdf1, range20)
  let x = forSparkline1 -> toString -> Sparklines.sparkly -> Js.Console.log
  makeTest("Spark1", 1, 0)
})
