open Jest;
open Expect;

describe("CDF", () => {
  module CDF =
    CDFunctor.Make({
      let shape: DistributionTypes.xyShape =
        CDFunctor.order({xs: [|1., 4., 8.|], ys: [|8., 9., 2.|]});
    });
  test("order", () => {
    Js.log(CDFunctor.order({xs: [|1., 4., 8.|], ys: [|8., 9., 2.|]}));
    Js.log(CDFunctor.order({xs: [|10., 5., 12.|], ys: [|8., 9., 2.|]}));
    expect(19.0) |> toEqual(19.0);
  });
});
