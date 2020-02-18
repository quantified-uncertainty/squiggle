open Jest;
open Expect;

let shape: DistributionTypes.xyShape = {
  xs: [|1., 4., 8.|],
  ys: [|8., 9., 2.|],
};

open Shape;

describe("Shape", () =>
  describe("XYShape", () => {
    test("#ySum", () =>
      expect(XYShape.ySum(shape)) |> toEqual(19.0)
    );
    test("#volume", () => {
      let shape: DistributionTypes.xyShape = {
        xs: [|1., 5., 10.|],
        ys: [|1., 2., 2.|],
      };
      expect(XYShape.volume(shape)) |> toEqual(Some(7.0));
    });
    test("#integral", () => {
      let expected: DistributionTypes.xyShape = {
        xs: [|1., 4., 8.|],
        ys: [|8., 17., 19.|],
      };
      expect(XYShape.volum2(shape)) |> toEqual(Some(expected));
    });
    test("#derivative", () => {
      let expected: DistributionTypes.xyShape = {
        xs: [|1., 4., 8.|],
        ys: [|8., 1., 1.|],
      };
      expect(XYShape.derivative(shape)) |> toEqual(expected);
    });
    // test("#both", () => {
    //   let expected: DistributionTypes.xyShape = {
    //     xs: [|1., 4., 8.|],
    //     ys: [|8., 1., 1.|],
    //   };
    //   expect(shape |> XYShape.derivative |> XYShape.integral)
    //   |> toEqual(shape);
    // });
  })
);