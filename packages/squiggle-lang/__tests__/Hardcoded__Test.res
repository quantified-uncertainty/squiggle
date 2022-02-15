open Jest
open Expect
/*
let makeTest = (~only=false, str, item1, item2) =>
  only
    ? Only.test(str, () =>
        expect(item1) |> toEqual(item2)
      )
    : test(str, () =>
        expect(item1) |> toEqual(item2)
      );

let evalParams: ASTTypes.AST.evaluationParams = {
  samplingInputs: {
    sampleCount: 1000,
    outputXYPoints: 10000,
    kernelWidth: None,
    shapeLength: 1000,
  },
  environment:
    [|
      ("K", `SymbolicDist(`Float(1000.0))),
      ("M", `SymbolicDist(`Float(1000000.0))),
      ("B", `SymbolicDist(`Float(1000000000.0))),
      ("T", `SymbolicDist(`Float(1000000000000.0))),
    |]
    ->Belt.Map.String.fromArray,
  evaluateNode: ASTEvaluator.toLeaf,
};

let shape1: PointSetTypes.xyShape = {xs: [|1., 4., 8.|], ys: [|0.2, 0.4, 0.8|]};

describe("XYShapes", () => {
  describe("logScorePoint", () => {
    makeTest(
      "When identical",
      {
        let foo =
          HardcodedFunctions.(
            makeRenderedDistFloat("scaleMultiply", (dist, float) =>
              verticalScaling(`Multiply, dist, float)
            )
          );

        TypeSystem.Function.T.run(
          evalParams,
          [|
            `SymbolicDist(`Float(100.0)),
            `SymbolicDist(`Float(1.0)),
          |],
          foo,
        );
      },
      Error("Sad"),
    )
  })
}); */
