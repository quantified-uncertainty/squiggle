open Jest
open Expect

let makeTest = (~only=false, str, item1, item2) =>
  only
    ? Only.test(str, () => expect(item1)->toEqual(item2))
    : test(str, () => expect(item1)->toEqual(item2))

let pointSetDist1: PointSetTypes.xyShape = {xs: [1., 4., 8.], ys: [0.2, 0.4, 0.8]}

let pointSetDist2: PointSetTypes.xyShape = {
  xs: [1., 5., 10.],
  ys: [0.2, 0.5, 0.8],
}

let pointSetDist3: PointSetTypes.xyShape = {
  xs: [1., 20., 50.],
  ys: [0.2, 0.5, 0.8],
}

describe("XYShapes", () => {
  describe("logScorePoint", () => {
    makeTest("When identical", XYShape.logScorePoint(30, pointSetDist1, pointSetDist1), Some(0.0))
    makeTest(
      "When similar",
      XYShape.logScorePoint(30, pointSetDist1, pointSetDist2),
      Some(1.658971191043856),
    )
    makeTest(
      "When very different",
      XYShape.logScorePoint(30, pointSetDist1, pointSetDist3),
      Some(210.3721280423322),
    )
  })
  // describe("transverse", () => {
  //   makeTest(
  //     "When very different",
  //     XYShape.Transversal._transverse(
  //       (aCurrent, aLast) => aCurrent +. aLast,
  //       [|1.0, 2.0, 3.0, 4.0|],
  //     ),
  //     [|1.0, 3.0, 6.0, 10.0|],
  //   )
  // });
  describe("integrateWithTriangles", () =>
    makeTest(
      "integrates correctly",
      XYShape.Range.integrateWithTriangles(pointSetDist1),
      Some({
        xs: [1., 4., 8.],
        ys: [0.0, 0.9000000000000001, 3.3000000000000007],
      }),
    )
  )
})
