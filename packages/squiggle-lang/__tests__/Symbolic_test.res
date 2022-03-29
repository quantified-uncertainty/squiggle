open Jest
open Expect
open Js.Array
open SymbolicDist

let makeTest = (~only=false, str, item1, item2) =>
  only
    ? Only.test(str, () => expect(item1) -> toEqual(item2))
    : test(str, () => expect(item1) -> toEqual(item2))

let pdfImage = (thePdf, inps) => map(thePdf, inps)

let parameterWiseAdditionHelper = (n1: SymbolicDistTypes.normal, n2: SymbolicDistTypes.normal) => {
  let normalDistAtSumMeanConstr = Normal.add(n1, n2)
  let normalDistAtSumMean: SymbolicDistTypes.normal = switch normalDistAtSumMeanConstr {
    | #Normal(params) => params
  }
  x => Normal.pdf(x, normalDistAtSumMean)
}

describe("Normal distribution with sparklines", () => {

  let normalDistAtMean5: SymbolicDistTypes.normal = {mean: 5.0, stdev: 2.0}
  let normalDistAtMean10: SymbolicDistTypes.normal = {mean: 10.0, stdev: 2.0}
  let range20Float = E.A.rangeFloat(0, 20) // [0.0,1.0,2.0,3.0,4.0,5.0,6.0,7.0,8.0,9.0,10.0,11.0,12.0,13.0,14.0,15.0,16.0,17.0,18.0,19.0,]

  let pdfNormalDistAtMean5 = x => Normal.pdf(x, normalDistAtMean5)
  let sparklineMean5 = pdfImage(pdfNormalDistAtMean5, range20Float)
  makeTest("mean=5", Sparklines.create(sparklineMean5, ()), `▁▂▃▅███▅▃▂▁▁▁▁▁▁▁▁▁▁▁`)

  let sparklineMean15 = normalDistAtMean5 -> parameterWiseAdditionHelper(normalDistAtMean10) -> pdfImage(range20Float)
  // let sparklineMean15 = pdfImage(pdfNormalDistAtMean15, range20Float)
  makeTest("parameter-wise addition of two normal distributions", Sparklines.create(sparklineMean15, ()), `▁▁▁▁▁▁▁▁▁▁▂▃▅▇███▇▅▃▂`)
})
