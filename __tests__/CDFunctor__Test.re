open Jest;
open Expect;

exception ShapeWrong(string);
describe("CDF", () => {
  test("raise - w/o order", () => {
    expect(() => {
      module CDF =
        CDFunctor.Make({
          let shape: DistributionTypes.xyShape = {
            xs: [|10., 4., 8.|],
            ys: [|8., 9., 2.|],
          };
        });
      ();
    })
    |> toThrow
  });
  test("raise - with order", () => {
    expect(() => {
      module CDF =
        CDFunctor.Make({
          let shape: DistributionTypes.xyShape = {
            xs: [|1., 4., 8.|],
            ys: [|8., 9., 2.|],
          };
        });
      ();
    })
    |> not_
    |> toThrow
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
  test("minX", () => {
    module CDF =
      CDFunctor.Make({
        let shape: DistributionTypes.xyShape =
          CDFunctor.order({xs: [|20., 4., 8.|], ys: [|8., 9., 2.|]});
      });
    expect(CDF.minX()) |> toEqual(4.);
  });
  test("maxX", () => {
    module CDF =
      CDFunctor.Make({
        let shape: DistributionTypes.xyShape =
          CDFunctor.order({xs: [|20., 4., 8.|], ys: [|8., 9., 2.|]});
      });
    expect(CDF.maxX()) |> toEqual(20.);
  });
});
