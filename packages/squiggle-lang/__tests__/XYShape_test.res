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

let makeAndGetErrorString = (~xs, ~ys) =>
  XYShape.T.make(~xs, ~ys)->E.R.getError->E.O2.fmap(XYShape.Error.toString)

describe("XYShapes", () => {
  describe("Validator", () => {
    makeTest(
      "with no errors",
      makeAndGetErrorString(~xs=[1.0, 4.0, 8.0], ~ys=[0.2, 0.4, 0.8]),
      None,
    )
    makeTest("when empty", makeAndGetErrorString(~xs=[], ~ys=[]), Some("Xs is empty"))
    makeTest(
      "when not sorted, different lengths, and not finite",
      makeAndGetErrorString(~xs=[2.0, 1.0, infinity, 0.0], ~ys=[3.0, Js.Float._NaN]),
      Some(
        "Multiple Errors: [Xs is not sorted], [Xs and Ys have different lengths. Xs has length 4 and Ys has length 2], [Xs is not finite. Example value: Infinity], [Ys is not finite. Example value: NaN]",
      ),
    )
  })

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
