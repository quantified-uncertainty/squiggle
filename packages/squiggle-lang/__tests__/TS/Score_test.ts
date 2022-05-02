import { testRun } from "./TestHelpers";

describe("KL divergence", () => {
  test.skip("by integral solver agrees with analytical", () => {
    let squiggleStringKL = `prediction=normal(4, 1)
             answer=normal(1,1)
             logSubtraction=dotSubtract(scaleLog(answer),scaleLog(prediction))
             klintegrand=dotMultiply(logSubtraction, answer)
             klintegral = integralSum(klintegrand)
             analyticalKl = log(1 / 1) + 1 ^ 2 / (2 * 1 ^ 2) + ((4 - 1) * (1 - 4) / (2 * 1 * 1)) - 1 / 2
             klintegral - analyticalKl`;
    let squiggleResultKL = testRun(squiggleStringKL);
    expect(squiggleResultKL.value).toBeCloseTo(0);
  });
});

let squiggleStringLS = `prediction=normal(4,1)
     answer=normal(1,1)
     logScore(prediction, answer)`;
