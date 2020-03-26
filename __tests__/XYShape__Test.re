open Jest;
open Expect;

let makeTest = (~only=false, str, item1, item2) =>
  only
    ? Only.test(str, () =>
        expect(item1) |> toEqual(item2)
      )
    : test(str, () =>
        expect(item1) |> toEqual(item2)
      );

let shape1: DistTypes.xyShape = {xs: [|1., 4., 8.|], ys: [|0.2, 0.4, 0.8|]};

let shape2: DistTypes.xyShape = {
  xs: [|1., 5., 10.|],
  ys: [|0.2, 0.5, 0.8|],
};

let shape3: DistTypes.xyShape = {
  xs: [|1., 20., 50.|],
  ys: [|0.2, 0.5, 0.8|],
};

describe("XYShapes", () => {
  describe("logScorePoint", () => {
    makeTest(
      "When identical",
      XYShape.logScorePoint(30, shape1, shape1),
      Some(0.0),
    );
    makeTest(
      "When similar",
      XYShape.logScorePoint(30, shape1, shape2),
      Some(1.658971191043856),
    );
    makeTest(
      "When very different",
      XYShape.logScorePoint(30, shape1, shape3),
      Some(210.3721280423322),
    );
  });
  describe("transverse", () => {
    makeTest(
      "When very different",
      XYShape.T.Transversal._transverse(
        (aCurrent, aLast) => aCurrent +. aLast,
        [|1.0, 2.0, 3.0, 4.0|],
      ),
      [|1.0, 3.0, 6.0, 10.0|],
    )
  });
  describe("integrateWithTriangles", () => {
    makeTest(
      "integrates correctly",
      XYShape.Range.integrateWithTriangles(shape1),
      Some({
        xs: [|1., 4., 8.|],
        ys: [|0.0, 0.9000000000000001, 3.3000000000000007|],
      }),
    )
  });
});