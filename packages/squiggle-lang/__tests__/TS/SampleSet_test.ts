import { Distribution } from "../../src/js/index";
import * as fc from "fast-check";

// Beware: float64Array makes it appear in an infinite loop.
let arrayGen = () =>
  fc.float32Array({
    minLength: 10,
    maxLength: 10000,
    noDefaultInfinity: true,
    noNaN: true,
  });

describe("SampleSet: cdf", () => {
  let n = 10000;
  test("at the highest number in the distribution is within epsilon of 1", () => {
    fc.assert(
      fc.property(arrayGen(), (xs) => {
        let ys = Array.from(xs);
        let max = Math.max(...ys);
        // Should compute with squiglge strings once interpreter has `sample`
        let dist = new Distribution(
          { tag: "SampleSet", value: ys },
          { sampleCount: n, xyPointLength: 100 }
        );
        let cdfValue = dist.cdf(max).value;
        let min = Math.min(...ys);
        let epsilon = 5e-3;
        if (max - min < epsilon) {
          expect(cdfValue).toBeLessThan(1 - epsilon);
        } else {
          expect(dist.cdf(max).value).toBeGreaterThan(1 - epsilon);
        }
      })
    );
  });

  // I may simply be mistaken about the math here.
  // test("at the lowest number in the distribution is within epsilon of 0", () => {
  //   fc.assert(
  //     fc.property(arrayGen(), (xs) => {
  //       let ys = Array.from(xs);
  //       let min = Math.min(...ys);
  //       // Should compute with squiggle strings once interpreter has `sample`
  //       let dist = new Distribution(
  //         { tag: "SampleSet", value: ys },
  //         { sampleCount: n, xyPointLength: 100 }
  //       );
  //       let cdfValue = dist.cdf(min).value;
  //       let max = Math.max(...ys);
  //       let epsilon = 5e-3;
  //       if (max - min < epsilon) {
  //         expect(cdfValue).toBeGreaterThan(4 * epsilon);
  //       } else {
  //         expect(cdfValue).toBeLessThan(4 * epsilon);
  //       }
  //     })
  //   );
  // });

  // I believe this is true, but due to bugs can't get the test to pass.
  //  test("is <= 1 everywhere with equality when x is higher than the max", () => {
  //    fc.assert(
  //      fc.property(arrayGen(), fc.float(), (xs, x) => {
  //        let ys = Array.from(xs);
  //        let dist = new Distribution(
  //          { tag: "SampleSet", value: ys },
  //          { sampleCount: n, xyPointLength: 100 }
  //        );
  //        let cdfValue = dist.cdf(x).value;
  //        let max = Math.max(...ys)
  //        if (x > max) {
  //          let epsilon = (x - max) / x
  //          expect(cdfValue).toBeGreaterThan(1 * (1 - epsilon));
  //        } else if (typeof cdfValue == "number") {
  //          expect(Math.round(1e5 * cdfValue) / 1e5).toBeLessThanOrEqual(1);
  //        } else {
  //          failDefault()
  //        }
  //      })
  //    );
  //  });

  test("is >= 0 everywhere with equality when x is lower than the min", () => {
    fc.assert(
      fc.property(arrayGen(), fc.float(), (xs, x) => {
        let ys = Array.from(xs);
        let dist = new Distribution(
          { tag: "SampleSet", value: ys },
          { sampleCount: n, xyPointLength: 100 }
        );
        let cdfValue = dist.cdf(x).value;
        if (x < Math.min(...ys)) {
          expect(cdfValue).toEqual(0);
        } else {
          expect(cdfValue).toBeGreaterThan(0);
        }
      })
    );
  });
});

// // I no longer believe this is true.
// describe("SampleSet: pdf", () => {
//  let n = 1000;
//
//  test("assigns to the max at most the weight of the mean", () => {
//    fc.assert(
//      fc.property(arrayGen(), (xs) => {
//        let ys = Array.from(xs);
//        let max = Math.max(...ys);
//        let mean = ys.reduce((a, b) => a + b, 0.0) / ys.length;
//        // Should be from squiggleString once interpreter exposes sampleset
//        let dist = new Distribution(
//          { tag: "SampleSet", value: ys },
//          { sampleCount: n, xyPointLength: 100 }
//        );
//        let pdfValueMean = dist.pdf(mean).value;
//        let pdfValueMax = dist.pdf(max).value;
//        if (typeof pdfValueMean == "number" && typeof pdfValueMax == "number") {
//          expect(pdfValueMax).toBeLessThanOrEqual(pdfValueMean);
//        } else {
//          expect(pdfValueMax).toEqual(pdfValueMean);
//        }
//      })
//    );
//  });
// });

// describe("SampleSet: mean is mean", () => {
//  test("mean(samples(xs)) sampling twice as widely as the input", () => {
//    fc.assert(
//      fc.property(
//        fc.float64Array({ minLength: 10, maxLength: 100000 }),
//        (xs) => {
//          let ys = Array.from(xs);
//          let n = ys.length;
//          let dist = new Distribution(
//            { tag: "SampleSet", value: ys },
//            { sampleCount: 2 * n, xyPointLength: 4 * n }
//          );
//
//          expect(dist.mean().value).toBeCloseTo(
//            ys.reduce((a, b) => a + b, 0.0) / n
//          );
//        }
//      )
//    );
//  });
//
//  test("mean(samples(xs)) sampling half as widely as the input", () => {
//    fc.assert(
//      fc.property(
//        fc.float64Array({ minLength: 10, maxLength: 100000 }),
//        (xs) => {
//          let ys = Array.from(xs);
//          let n = ys.length;
//          let dist = new Distribution(
//            { tag: "SampleSet", value: ys },
//            { sampleCount: Math.floor(5 / 2), xyPointLength: 4 * n }
//          );
//
//          expect(dist.mean().value).toBeCloseTo(
//            ys.reduce((a, b) => a + b, 0.0) / n
//          );
//        }
//      )
//    );
//  });
// });

// describe("Mean of mixture is weighted average of means", () => {
//  test("mx(beta(a,b), lognormal(m,s), [x,y])", () => {
//    fc.assert(
//      fc.property(
//        fc.float({ min: 1e-1 }),  // alpha
//        fc.float({ min: 1 }),   // beta
//        fc.float(),  // mu
//        fc.float({ min: 1e-1 }),  // sigma
//        fc.float({ min: 1e-7 }),
//        fc.float({ min: 1e-7 }),
//        (a, b, m, s, x, y) => {
//          let squiggleString = `mean(mx(beta(${a},${b}), lognormal(${m},${s}), [${x}, ${y}]))`;
//          let res = testRun(squiggleString);
//          switch (res.tag) {
//            case "Error":
//              expect(errorValueToString(res.value)).toEqual(
//                "<I wonder if test cases will find this>"
//              );
//            case "Ok":
//              let betaWeight = x / (x + y);
//              let lognormalWeight = y / (x + y);
//              let betaMean = 1 / (1 + b / a);
//              let lognormalMean = m + s ** 2 / 2;
//              expect(res.value).toEqual({
//                tag: "number",
//                value: betaWeight * betaMean + lognormalWeight * lognormalMean,
//              });
//            default:
//              expect("mean returned").toBe(`something other than a number`);
//          }
//        }
//      )
//    );
//  });
// });
