open Jest;
open Expect;

describe("CDF", () => {
  module CDF =
    CDFunctor.Make({
      let shape: DistributionTypes.xyShape =
        CDFunctor.order({xs: [|1., 4., 8.|], ys: [|8., 9., 2.|]});
    });
  test("order#1", () => {
    let a = CDFunctor.order({xs: [|1., 4., 8.|], ys: [|8., 9., 2.|]});
    let b: DistributionTypes.xyShape = {
      xs: [|1., 4., 8.|],
      ys: [|8., 9., 2.|],
    };
    expect(a) |> toEqual(b);
  });
  test("order#2", () => {
    let a = CDFunctor.order({xs: [|10., 5., 12.|], ys: [|8., 9., 2.|]});
    let b: DistributionTypes.xyShape = {
      xs: [|5., 10., 12.|],
      ys: [|9., 8., 2.|],
    };
    expect(a) |> toEqual(b);
  });
});
