open Jest;
open Expect;

let shape: DistTypes.xyShape = {xs: [|1., 4., 8.|], ys: [|8., 9., 2.|]};

let step: DistTypes.xyShape = {
  xs: [|1., 4., 8.|],
  ys: [|8., 17., 19.|],
} /*   }*/ /*     )*/;

// describe("Shape", () =>
//   describe("XYShape", () => {
//     test("#ySum", () =>
//       expect(XYShape.ySum(shape)) |> toEqual(19.0)
//     );
//     test("#yFOo", () =>
//       expect(Discrete.integrate(shape)) |> toEqual(step)