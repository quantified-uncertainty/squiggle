open Jest;
open Expect;

exception ShapeWrong(string);
describe("Functions", () => {
  test("interpolate", () => {
    let a = Functions.interpolate(10., 20., 1., 2., 15.);
    let b = 1.5;
    expect(a) |> toEqual(b);
  });
  test("range#1", () => {
    expect(Functions.range(1., 5., 3)) |> toEqual([|1., 3., 5.|])
  });
  test("range#2", () => {
    expect(Functions.range(1., 5., 5)) |> toEqual([|1., 2., 3., 4., 5.|])
  });
  test("range#3", () => {
    expect(Functions.range(-10., 15., 2)) |> toEqual([|(-10.), 15.|])
  });
  test("range#4", () => {
    expect(Functions.range(-10., 15., 3)) |> toEqual([|(-10.), 2.5, 15.|])
  });
  test("range#5", () => {
    expect(Functions.range(-10.3, 17., 3))
    |> toEqual([|(-10.3), 3.3499999999999996, 17.|])
  });
  test("range#6", () => {
    expect(Functions.range(-10.3, 17., 5))
    |> toEqual([|
         (-10.3),
         (-3.4750000000000005),
         3.3499999999999996,
         10.175,
         17.0,
       |])
  });
  test("range#7", () => {
    expect(Functions.range(-10.3, 17.31, 3))
    |> toEqual([|(-10.3), 3.504999999999999, 17.31|])
  });
  test("range#8", () => {
    expect(Functions.range(1., 1., 3)) |> toEqual([|1., 1., 1.|])
  });
  test("mean#1", () => {
    expect(Functions.mean([|1., 2., 3.|])) |> toEqual(2.)
  });
  test("mean#2", () => {
    expect(Functions.mean([|1., 2., 3., (-2.)|])) |> toEqual(1.)
  });
  test("mean#3", () => {
    expect(Functions.mean([|1., 2., 3., (-2.), (-10.)|])) |> toEqual(-1.2)
  });
});
