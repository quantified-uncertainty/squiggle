open Jest;
open Expect;

exception ShapeWrong(string);
describe("CDF", () => {
  test("raise - w/o order", () => {
    expect(() => {
      module Cdf =
        CDF.Make({
          let shape: DistTypes.xyShape = {
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
      module Cdf =
        CDF.Make({
          let shape: DistTypes.xyShape = {
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
    let a = CDF.order({xs: [|1., 4., 8.|], ys: [|8., 9., 2.|]});
    let b: DistTypes.xyShape = {xs: [|1., 4., 8.|], ys: [|8., 9., 2.|]};
    expect(a) |> toEqual(b);
  });
  test("order#2", () => {
    let a = CDF.order({xs: [|10., 5., 12.|], ys: [|8., 9., 2.|]});
    let b: DistTypes.xyShape = {xs: [|5., 10., 12.|], ys: [|9., 8., 2.|]};
    expect(a) |> toEqual(b);
  });

  describe("minX - maxX", () => {
    module Dist =
      CDF.Make({
        let shape = CDF.order({xs: [|20., 4., 8.|], ys: [|8., 9., 2.|]});
      });
    test("minX", () => {
      expect(Dist.minX()) |> toEqual(4.)
    });
    test("maxX", () => {
      expect(Dist.maxX()) |> toEqual(20.)
    });
  });

  describe("findY", () => {
    module Dist =
      CDF.Make({
        let shape = CDF.order({xs: [|1., 2., 3.|], ys: [|5., 6., 7.|]});
      });
    test("#1", () => {
      expect(Dist.findY(1.)) |> toEqual(5.)
    });
    test("#2", () => {
      expect(Dist.findY(1.5)) |> toEqual(5.5)
    });
    test("#3", () => {
      expect(Dist.findY(3.)) |> toEqual(7.)
    });
    test("#4", () => {
      expect(Dist.findY(4.)) |> toEqual(7.)
    });
    test("#5", () => {
      expect(Dist.findY(15.)) |> toEqual(7.)
    });
    test("#6", () => {
      expect(Dist.findY(-1.)) |> toEqual(5.)
    });
  });

  describe("findX", () => {
    module Dist =
      CDF.Make({
        let shape = CDF.order({xs: [|1., 2., 3.|], ys: [|5., 6., 7.|]});
      });
    test("#1", () => {
      expect(Dist.findX(5.)) |> toEqual(1.)
    });
    test("#2", () => {
      expect(Dist.findX(7.)) |> toEqual(3.)
    });
    test("#3", () => {
      expect(Dist.findX(5.5)) |> toEqual(1.5)
    });
    test("#4", () => {
      expect(Dist.findX(8.)) |> toEqual(3.)
    });
    test("#5", () => {
      expect(Dist.findX(4.)) |> toEqual(1.)
    });
  });

  describe("convertWithAlternativeXs", () => {
    open Functions;
    let xs = up(1, 9);
    let ys = up(20, 28);
    module Dist =
      CDF.Make({
        let shape = CDF.order({xs, ys});
      });

    let xs2 = up(3, 7);
    module Dist2 =
      CDF.Make({
        let shape = Dist.convertWithAlternativeXs(xs2);
      });

    test("#1", () => {
      expect(Dist2.xs) |> toEqual([|3., 4., 5., 6., 7.|])
    });
    test("#2", () => {
      expect(Dist2.ys) |> toEqual([|22., 23., 24., 25., 26.|])
    });
  });

  describe("convertToNewLength", () => {
    open Functions;
    let xs = up(1, 9);
    let ys = up(50, 58);
    module Dist =
      CDF.Make({
        let shape = CDF.order({xs, ys});
      });
    module Dist2 =
      CDF.Make({
        let shape = Dist.convertToNewLength(3);
      });
    test("#1", () => {
      expect(Dist2.xs) |> toEqual([|1., 5., 9.|])
    });
    test("#2", () => {
      expect(Dist2.ys) |> toEqual([|50., 54., 58.|])
    });
  });

  // @todo
  describe("sample", () => {
    open Functions;
    let xs = up(1, 9);
    let ys = up(70, 78);
    module Dist =
      CDF.Make({
        let shape = CDF.order({xs, ys});
      });

    let xs2 = Dist.sample(3);
    test("#1", () => {
      expect(xs2[0]) |> toBe(70.)
    });
    test("#2", () => {
      expect(xs2[1]) |> toBe(70.)
    });
    test("#3", () => {
      expect(xs2[2]) |> toBe(70.)
    });
  });

  describe("integral", () => {
    module Dist =
      CDF.Make({
        let shape =
          CDF.order({xs: [|0., 1., 2., 4.|], ys: [|0.0, 1.0, 2.0, 2.0|]});
      });
    test("with regular inputs", () => {
      expect(Dist.integral()) |> toBe(6.)
    });
  });
});
