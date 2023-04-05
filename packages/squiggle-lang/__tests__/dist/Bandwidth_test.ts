import { nrd, nrd0 } from "../../src/dist/SampleSetDist/bandwidth.js";

describe("Bandwidth", () => {
  test("nrd0()", () => {
    const data = [1, 2, 3, 4];
    expect(nrd0(data)).toEqual(0.7625801874014622);
  });
  test("nrd()", () => {
    const data = [1, 2, 3, 4];
    expect(nrd(data)).toEqual(0.8981499984950554);
  });
});
