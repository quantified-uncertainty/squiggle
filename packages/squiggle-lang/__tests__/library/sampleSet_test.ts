import { expectErrorToBeBounded, testRun } from "../helpers/helpers.js";
import * as fc from "fast-check";
import { testEvalToBe } from "../helpers/reducerHelpers.js";

describe("Various SampleSet functions", () => {
  testEvalToBe(
    "SampleSet.fromList([3,5,2,3,5,2,3,5,2,3,3,5])",
    "Sample Set Distribution"
  );
  testEvalToBe(
    "SampleSet.fromList([3,5,2,3,5,2,3,5,2,3,3,5])",
    "Sample Set Distribution"
  );
  testEvalToBe(
    "SampleSet.fromFn({|i| sample(normal(5,2))})",
    "Sample Set Distribution"
  );
  testEvalToBe(
    "SampleSet.min(SampleSet.fromDist(normal(50,2)), 2)",
    "Sample Set Distribution"
  );
  testEvalToBe("mean(SampleSet.min(SampleSet.fromDist(normal(50,2)), 2))", "2");
  testEvalToBe(
    "SampleSet.max(SampleSet.fromDist(normal(50,2)), 10)",
    "Sample Set Distribution"
  );
  testEvalToBe(
    "addOne(t)=t+1; SampleSet.toList(SampleSet.map(SampleSet.fromList([1,2,3,4,5,6]), addOne))",
    "[2,3,4,5,6,7]"
  );
  testEvalToBe(
    "SampleSet.toList(SampleSet.mapN([SampleSet.fromList([1,2,3,4,5,6]), SampleSet.fromList([6, 5, 4, 3, 2, 1])], {|x| x[0] > x[1] ? x[0] : x[1]}))",
    "[6,5,4,4,5,6]"
  );
  testEvalToBe(
    "SampleSet.fromList([1, 2, 3])",
    "Error(Distribution Math Error: Too few samples when constructing sample set)"
  );

  testEvalToBe("SampleSet.fromList([5,5,5,5,5,5]) -> sampleN(10) -> sum", "50");
  testEvalToBe(
    "SampleSet.fromList([5,5,5,5,5,5]) -> sampleN(10) -> List.length",
    "10"
  );
});

describe("truncate", () => {
  testEvalToBe(
    "normal(3, 5) -> truncateLeft(0) -> SampleSet.toList -> List.length",
    "1000"
  );
  testEvalToBe(
    "normal(3, 5) -> truncateRight(0) -> SampleSet.toList -> List.length",
    "1000"
  );
  testEvalToBe(
    "(2 to 5) -> truncateRight(0)",
    "Error(Distribution Math Error: Too few samples when constructing sample set)"
  );
});

// Beware: float64Array makes it appear in an infinite loop.
const arrayGen = () =>
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

async function makeSampleSet(samples: number[]) {
  const sampleList = samples.map((x) => x.toFixed(20)).join(",");
  const result = await testRun(`SampleSet.fromList([${sampleList}])`);
  if (result.tag === "Dist") {
    return result.value;
  } else {
    throw new Error("Expected to be distribution");
  }
}

const env = { sampleCount: 10000, xyPointLength: 100 };

describe("cumulative density function", () => {
  // We should fix this.
  test.skip("'s codomain is bounded above", () => {
    fc.assert(
      fc.asyncProperty(arrayGen(), fc.float(), async (xs_, x) => {
        const xs = Array.from(xs_);
        // Should compute with squiggle strings once interpreter has `sample`
        const result = await makeSampleSet(xs);
        const cdfValue = result.cdf(env, x).value;
        const epsilon = 5e-7;
        expect(cdfValue).toBeLessThanOrEqual(1 + epsilon);
      })
    );
  });

  test.skip("'s codomain is bounded below", () => {
    fc.assert(
      fc.asyncProperty(arrayGen(), fc.float(), async (xs_, x) => {
        const xs = Array.from(xs_);
        // Should compute with squiggle strings once interpreter has `sample`
        const result = await makeSampleSet(xs);
        const cdfValue = result.cdf(env, x).value;
        expect(cdfValue).toBeGreaterThanOrEqual(0);
      })
    );
  });

  // This may not be true due to KDE estimating there to be mass above the
  // highest value. These tests fail
  test.skip("at the highest number in the sample is close to 1", () => {
    fc.assert(
      fc.asyncProperty(arrayGen(), async (xs_) => {
        const xs = Array.from(xs_);
        const max = Math.max(...xs);
        // Should compute with squiggle strings once interpreter has `sample`
        const result = await makeSampleSet(xs);
        const cdfValue = result.cdf(env, max).value;
        expect(cdfValue).toBeCloseTo(1.0, 2);
      })
    );
  });

  // I may simply be mistaken about the math here.
  test.skip("at the lowest number in the distribution is within epsilon of 0", () => {
    fc.assert(
      fc.asyncProperty(arrayGen(), async (xs_) => {
        const xs = Array.from(xs_);
        const min = Math.min(...xs);
        // Should compute with squiggle strings once interpreter has `sample`
        const result = await makeSampleSet(xs);
        const cdfValue = result.cdf(env, min).value;
        const max = Math.max(...xs);
        const epsilon = 5e-3;
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
      fc.asyncProperty(arrayGen(), fc.float(), async (xs_, x) => {
        const xs = Array.from(xs_);
        const dist = await makeSampleSet(xs);
        const cdfValue = dist.cdf(env, x).value;
        const max = Math.max(...xs);
        if (x > max) {
          const epsilon = (x - max) / x;
          expect(cdfValue).toBeGreaterThan(1 * (1 - epsilon));
        } else if (typeof cdfValue == "number") {
          expect(Math.round(1e5 * cdfValue) / 1e5).toBeLessThanOrEqual(1);
        } else {
          throw new Error();
        }
      })
    );
  });

  test.skip("is non-negative everywhere with zero when x is lower than the min", () => {
    fc.assert(
      fc.asyncProperty(arrayGen(), fc.float(), async (xs_, x) => {
        const xs = Array.from(xs_);
        const dist = await makeSampleSet(xs);
        const cdfValue = dist.cdf(env, x).value;
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
      fc.asyncProperty(arrayGen(), async (xs_) => {
        const xs = Array.from(xs_);
        const max = Math.max(...xs);
        const mean = xs.reduce((a, b) => a + b, 0.0) / xs.length;
        // Should be from squiggleString once interpreter exposes sampleset
        const dist = await makeSampleSet(xs);
        const pdfValueMean = dist.pdf(env, mean).value;
        const pdfValueMax = dist.pdf(env, max).value;
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
      fc.asyncProperty(
        fc.float64Array({ minLength: 10, maxLength: 100000 }),
        async (xs_) => {
          const xs = Array.from(xs_);
          const n = xs.length;
          const dist = await makeSampleSet(xs);
          const myEnv = { sampleCount: 2 * n, xyPointLength: 4 * n };
          const mean = dist.mean(myEnv);
          if (typeof mean === "number") {
            expectErrorToBeBounded(mean, xs.reduce((a, b) => a + b, 0.0) / n, {
              epsilon: 5e-1,
            });
          } else {
            throw new Error();
          }
        }
      )
    );
  });

  test.skip("when sampling half as widely as the input", () => {
    fc.assert(
      fc.asyncProperty(
        fc.float64Array({ minLength: 10, maxLength: 100000 }),
        async (xs_) => {
          const xs = Array.from(xs_);
          const n = xs.length;
          const dist = await makeSampleSet(xs);
          const myEnv = {
            sampleCount: Math.floor(n / 2),
            xyPointLength: 4 * n,
          };
          const mean = dist.mean(myEnv);
          if (typeof mean === "number") {
            expectErrorToBeBounded(mean, xs.reduce((a, b) => a + b, 0.0) / n, {
              epsilon: 5e-1,
            });
          } else {
            throw new Error();
          }
        }
      )
    );
  });
});

describe("fromSamples function", () => {
  test.skip("gives a mean near the mean of the input", () => {
    fc.assert(
      fc.asyncProperty(arrayGen(), async (xs_) => {
        const xs = Array.from(xs_);
        const xsString = xs.toString();
        const squiggleString = `x = fromSamples([${xsString}]); mean(x)`;
        const squiggleResult = await testRun(squiggleString);
        const mean = xs.reduce((a, b) => a + b, 0.0) / xs.length;
        expect(squiggleResult.value).toBeCloseTo(mean, 4);
      })
    );
  });
});
