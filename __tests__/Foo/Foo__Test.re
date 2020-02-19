open Jest;
open Expect;

let shape: DistributionTypes.xyShape = {
  xs: [|1., 4., 8.|],
  ys: [|8., 9., 2.|],
};

open Shape;

describe("Shape", () =>
  describe("XYShape", () =>
    test("#ySum", ()
      =>
        expect(XYShape.ySum(shape)) |> toEqual(19.0)
      )
      // test("#both", () => {
      //   let expected: DistributionTypes.xyShape = {
      //     xs: [|1., 4., 8.|],
      //     ys: [|8., 1., 1.|],
      //   };
      //   expect(shape |> XYShape.derivative |> XYShape.integral)
      //   |> toEqual(shape);
      // });
  )
);