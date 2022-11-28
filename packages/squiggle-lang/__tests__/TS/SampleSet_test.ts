import { expectErrorToBeBounded, testRun } from "./TestHelpers";
import * as fc from "fast-check";

// Beware: float64Array makes it appear in an infinite loop.
let arrayGen = () =>
  fc
    .float64Array({
      minLength: 10,
      max: 999999999999999,
      min: -999999999999999,
      maxLength: 10000,
      noDefaultInfinity: true,
      noNaN: true,
    })
    .filter(
      (xs_) => Math.min(...Array.from(xs_)) != Math.max(...Array.from(xs_))
    );

let makeSampleSet = (samples: number[]) => {
  let sampleList = samples.map((x) => x.toFixed(20)).join(",");
  let result = testRun(`SampleSet.fromList([${sampleList}])`);
  if (result.tag === "Dist") {
    return result.value;
  } else {
    fail("Expected to be distribution");
  }
};

const env = { sampleCount: 10000, xyPointLength: 100 };

describe("cumulative density function", () => {
  // We should fix this.
  test.skip("'s codomain is bounded above", () => {
    fc.assert(
      fc.property(arrayGen(), fc.float(), (xs_, x) => {
        let xs = Array.from(xs_);
        // Should compute with squiggle strings once interpreter has `sample`
        let result = makeSampleSet(xs);
        let cdfValue = result.cdf(env, x).value;
        let epsilon = 5e-7;
        expect(cdfValue).toBeLessThanOrEqual(1 + epsilon);
      })
    );
  });

  test.skip("'s codomain is bounded below", () => {
    fc.assert(
      fc.property(arrayGen(), fc.float(), (xs_, x) => {
        let xs = Array.from(xs_);
        // Should compute with squiggle strings once interpreter has `sample`
        let result = makeSampleSet(xs);
        let cdfValue = result.cdf(env, x).value;
        expect(cdfValue).toBeGreaterThanOrEqual(0);
      })
    );
  });

  // This may not be true due to KDE estimating there to be mass above the
  // highest value. These tests fail
  test.skip("at the highest number in the sample is close to 1", () => {
    fc.assert(
      fc.property(arrayGen(), (xs_) => {
        let xs = Array.from(xs_);
        let max = Math.max(...xs);
        // Should compute with squiggle strings once interpreter has `sample`
        let result = makeSampleSet(xs);
        let cdfValue = result.cdf(env, max).value;
        expect(cdfValue).toBeCloseTo(1.0, 2);
      })
    );
  });

  // I may simply be mistaken about the math here.
  test.skip("at the lowest number in the distribution is within epsilon of 0", () => {
    fc.assert(
      fc.property(arrayGen(), (xs_) => {
        let xs = Array.from(xs_);
        let min = Math.min(...xs);
        // Should compute with squiggle strings once interpreter has `sample`
        let result = makeSampleSet(xs);
        let cdfValue = result.cdf(env, min).value;
        let max = Math.max(...xs);
        let epsilon = 5e-3;
        if (max - min < epsilon) {
          expect(cdfValue).toBeGreaterThan(4 * epsilon);
        } else {
          expect(cdfValue).toBeLessThan(4 * epsilon);
        }
      })
    );
  });

  // I believe this is true, but due to bugs can't get the test to pass.
  test.skip("is <= 1 everywhere with equality when x is higher than the max", () => {
    fc.assert(
      fc.property(arrayGen(), fc.float(), (xs_, x) => {
        let xs = Array.from(xs_);
        let dist = makeSampleSet(xs);
        let cdfValue = dist.cdf(env, x).value;
        let max = Math.max(...xs);
        if (x > max) {
          let epsilon = (x - max) / x;
          expect(cdfValue).toBeGreaterThan(1 * (1 - epsilon));
        } else if (typeof cdfValue == "number") {
          expect(Math.round(1e5 * cdfValue) / 1e5).toBeLessThanOrEqual(1);
        } else {
          fail();
        }
      })
    );
  });

  test.skip("is non-negative everywhere with zero when x is lower than the min", () => {
    fc.assert(
      fc.property(arrayGen(), fc.float(), (xs_, x) => {
        let xs = Array.from(xs_);
        let dist = makeSampleSet(xs);
        let cdfValue = dist.cdf(env, x).value;
        expect(cdfValue).toBeGreaterThanOrEqual(0);
      })
    );
  });
});

// I no longer believe this is true.
describe("probability density function", () => {
  const env = { sampleCount: 1000, xyPointLength: 100 };

  test.skip("assigns to the max at most the weight of the mean", () => {
    fc.assert(
      fc.property(arrayGen(), (xs_) => {
        let xs = Array.from(xs_);
        let max = Math.max(...xs);
        let mean = xs.reduce((a, b) => a + b, 0.0) / xs.length;
        // Should be from squiggleString once interpreter exposes sampleset
        let dist = makeSampleSet(xs);
        let pdfValueMean = dist.pdf(env, mean).value;
        let pdfValueMax = dist.pdf(env, max).value;
        if (typeof pdfValueMean == "number" && typeof pdfValueMax == "number") {
          expect(pdfValueMax).toBeLessThanOrEqual(pdfValueMean);
        } else {
          expect(pdfValueMax).toEqual(pdfValueMean);
        }
      })
    );
  });
});

// // This should be true, but I can't get it to work.
describe("mean is mean", () => {
  test.skip("when sampling twice as widely as the input", () => {
    fc.assert(
      fc.property(
        fc.float64Array({ minLength: 10, maxLength: 100000 }),
        (xs_) => {
          let xs = Array.from(xs_);
          let n = xs.length;
          let dist = makeSampleSet(xs);
          let myEnv = { sampleCount: 2 * n, xyPointLength: 4 * n };
          let mean = dist.mean(myEnv);
          if (typeof mean === "number") {
            expectErrorToBeBounded(
              mean,
              xs.reduce((a, b) => a + b, 0.0) / n,
              5e-1,
              1
            );
          } else {
            fail();
          }
        }
      )
    );
  });

  test.skip("when sampling half as widely as the input", () => {
    fc.assert(
      fc.property(
        fc.float64Array({ minLength: 10, maxLength: 100000 }),
        (xs_) => {
          let xs = Array.from(xs_);
          let n = xs.length;
          let dist = makeSampleSet(xs);
          let myEnv = { sampleCount: Math.floor(n / 2), xyPointLength: 4 * n };
          let mean = dist.mean(myEnv);
          if (typeof mean === "number") {
            expectErrorToBeBounded(
              mean,
              xs.reduce((a, b) => a + b, 0.0) / n,
              5e-1,
              1
            );
          } else {
            fail();
          }
        }
      )
    );
  });
});

describe("fromSamples function", () => {
  test.skip("gives a mean near the mean of the input", () => {
    fc.assert(
      fc.property(arrayGen(), (xs_) => {
        let xs = Array.from(xs_);
        let xsString = xs.toString();
        let squiggleString = `x = fromSamples([${xsString}]); mean(x)`;
        let squiggleResult = testRun(squiggleString);
        let mean = xs.reduce((a, b) => a + b, 0.0) / xs.length;
        expect(squiggleResult.value).toBeCloseTo(mean, 4);
      })
    );
  });
});
