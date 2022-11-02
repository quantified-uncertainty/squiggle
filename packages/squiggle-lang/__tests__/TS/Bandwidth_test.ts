const {
  nrd,
  nrd0,
} = require("../../src/rescript/Distributions/SampleSetDist/SampleSetDist_Bandwidth.js");

describe("Bandwidth", () => {
  test("nrd0()", () => {
    const data = [1, 4, 3, 2];
    expect(nrd0(data)).toEqual(0.7625801874014622);
  });
  test("nrd()", () => {
    const data = [1, 4, 3, 2];
    expect(nrd(data)).toEqual(0.8981499984950554);
  });
});
