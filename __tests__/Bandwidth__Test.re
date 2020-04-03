open Jest;
open Expect;

describe("Bandwidth", () => {
  test("nrd0 1", () => {
    let data = [|1., 4., 3., 2.|];
    expect(Science.nrd0(data)) |> toEqual(0.7635139420854616);
  });
  test("nrd0 2", () => {
    let data = [|1., 4., 3., 2.|];
    expect(Science.nrd(data)) |> toEqual(0.899249754011766);
  });
});