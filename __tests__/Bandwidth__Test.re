open Jest;
open Expect;

[@bs.val] [@bs.module "science"] [@bs.scope ("stats", "bandwidth")]
external nrd0: array(float) => float = "nrd0";

[@bs.val] [@bs.module "science"] [@bs.scope ("stats", "bandwidth")]
external nrd: array(float) => float = "nrd";

describe("Bandwidth", () => {
  test("nrd0 1", () => {
    let data = [|1., 4., 3., 2.|];
    expect(nrd0(data)) |> toEqual(0.7635139420854616);
  });
  test("nrd0 2", () => {
    let data = [|1., 4., 3., 2.|];
    expect(nrd(data)) |> toEqual(0.899249754011766);
  });
});