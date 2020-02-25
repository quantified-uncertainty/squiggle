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
  test("min#1", () => {
    expect(Functions.min([|1., 2., 3.|])) |> toEqual(1.)
  });
  test("min#2", () => {
    expect(Functions.min([|(-1.), (-2.), 0., 20.|])) |> toEqual(-2.)
  });
  test("min#3", () => {
    expect(Functions.min([|(-1.), (-2.), 0., 20., (-2.2)|]))
    |> toEqual(-2.2)
  });
  test("max#1", () => {
    expect(Functions.max([|1., 2., 3.|])) |> toEqual(3.)
  });
  test("max#2", () => {
    expect(Functions.max([|(-1.), (-2.), 0., 20.|])) |> toEqual(20.)
  });
  test("max#3", () => {
    expect(Functions.max([|(-1.), (-2.), 0., (-2.2)|])) |> toEqual(0.)
  });
  test("random#1", () => {
    expect(Functions.random(1, 5)) |> toBeLessThanOrEqual(5)
  });
  test("random#2", () => {
    expect(Functions.random(1, 5)) |> toBeGreaterThanOrEqual(1)
  });
  test("up#1", () => {
    expect(Functions.up(1, 5)) |> toEqual([|1., 2., 3., 4., 5.|])
  });
  test("up#2", () => {
    expect(Functions.up(-1, 5))
    |> toEqual([|(-1.), 0., 1., 2., 3., 4., 5.|])
  });
  test("down#1", () => {
    expect(Functions.down(5, 1)) |> toEqual([|5., 4., 3., 2., 1.|])
  });
  test("down#2", () => {
    expect(Functions.down(5, -1))
    |> toEqual([|5., 4., 3., 2., 1., 0., (-1.)|])
  });
});
