open Jest
open Expect

describe("Bandwidth", () => {
  test("nrd0()", () => {
    let data = [1., 4., 3., 2.]
    expect(SampleSetDist_Bandwidth.nrd0(data)) -> toEqual(0.7625801874014622)
  })
  test("nrd()", () => {
    let data = [1., 4., 3., 2.]
    expect(SampleSetDist_Bandwidth.nrd(data)) -> toEqual(0.8981499984950554)
  })
})
