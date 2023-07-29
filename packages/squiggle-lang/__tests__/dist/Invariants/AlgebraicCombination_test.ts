/*
This file is like a half measure between one-off unit tests and proper invariant validation. 
As such, I'm not that excited about it, though it does provide some structure and will alarm us 
when things substantially change. 
Also, there are some open comments in https://github.com/quantified-uncertainty/squiggle/pull/232 that haven't been addressed.
*/

import * as Result from "../../../src/utility/result.js";
import {
  betaDist,
  normalDist10,
  normalDist20,
  normalDist5,
  uniformDist,
} from "../../fixtures/distFixtures.js";

import { binaryOperations } from "../../../src/dist/distOperations/index.js";
import { env, unpackResult } from "../../helpers/distHelpers.js";
const { algebraicAdd } = binaryOperations;

describe("(Algebraic) addition of distributions", () => {
  describe("mean", () => {
    test("normal(mean=5) + normal(mean=20)", () => {
      expect(
        unpackResult(algebraicAdd(normalDist5, normalDist20, { env })).mean()
      ).toBe(2.5e1);
    });

    test("uniform(low=9, high=10) + beta(alpha=2, beta=5)", () => {
      const received = unpackResult(
        algebraicAdd(uniformDist, betaDist, { env })
      ).mean();
      // This is nondeterministic, we could be in a situation where ci fails but you click rerun and it passes, which is bad.
      // sometimes it works with ~digits=2.
      expect(received).toBeCloseTo(9.786831807237022, 1); // (uniformMean +. betaMean)
    });
    test("beta(alpha=2, beta=5) + uniform(low=9, high=10)", () => {
      const received = unpackResult(
        algebraicAdd(betaDist, uniformDist, { env })
      ).mean();

      // This is nondeterministic, we could be in a situation where ci fails but you click rerun and it passes, which is bad.
      // sometimes it works with ~digits=2.
      expect(received).toBeCloseTo(9.784290207736126, 1);
    });
  });
  describe("pdf", () => {
    // TEST IS WRONG. SEE STDEV ADDITION EXPRESSION.
    test.each([8, 1e1, 1.2e1, 1.4e1])(
      "(normal(mean=5) + normal(mean=5)).pdf (imprecise)",
      (x) => {
        const received = unpackResult(normalDist10.pdf(x)); // this should be normal(10, sqrt(8))
        const calculated: number = unpackResult(
          Result.bind(algebraicAdd(normalDist5, normalDist5, { env }), (d) =>
            d.pdf(x, { env })
          )
        );

        expect(received).toBeCloseTo(calculated, 0);
      }
    );

    test("(normal(mean=10) + normal(mean=10)).pdf(1.9e1)", () => {
      const received = unpackResult(normalDist20.pdf(1.9e1));
      const calculated: number = unpackResult(
        Result.bind(algebraicAdd(normalDist10, normalDist10, { env }), (d) =>
          d.pdf(1.9e1, { env })
        )
      );

      expect(received).toBeCloseTo(calculated, 1);
    });
    test("(uniform(low=9, high=10) + beta(alpha=2, beta=5)).pdf(10)", () => {
      const received: number = unpackResult(
        Result.bind(algebraicAdd(uniformDist, betaDist, { env }), (d) =>
          d.pdf(1e1, { env })
        )
      );

      // This is nondeterministic, we could be in a situation where ci fails but you click rerun and it passes, which is bad.
      // sometimes it works with ~digits=4.
      // This value was calculated by a python script
      expect(received).toBeCloseTo(0.979023, 0);
    });
    test("(beta(alpha=2, beta=5) + uniform(low=9, high=10)).pdf(10)", () => {
      const received = unpackResult(
        Result.bind(algebraicAdd(betaDist, uniformDist, { env }), (d) =>
          d.pdf(1e1, { env })
        )
      );

      // This is nondeterministic.
      expect(received).toBeCloseTo(0.979023, 0);
    });
  });
  describe("cdf", () => {
    test.each([6, 8, 1e1, 1.2e1])(
      "(normal(mean=5) + normal(mean=5)).cdf (imprecise)",
      (x) => {
        const received = normalDist10.cdf(x);
        const calculated = unpackResult(
          algebraicAdd(normalDist5, normalDist5, { env })
        ).cdf(x);

        expect(received).toBeCloseTo(calculated, 0);
      }
    );

    test("(normal(mean=10) + normal(mean=10)).cdf(1.25e1)", () => {
      const received = normalDist20.cdf(1.25e1);

      const calculated = unpackResult(
        algebraicAdd(normalDist10, normalDist10, { env })
      ).cdf(1.25e1);

      expect(received).toBeCloseTo(calculated, 2);
    });
    test("(uniform(low=9, high=10) + beta(alpha=2, beta=5)).cdf(10)", () => {
      const received = unpackResult(
        algebraicAdd(uniformDist, betaDist, { env })
      ).cdf(1e1);

      // This is nondeterministic, we could be in a situation where ci fails but you click rerun and it passes, which is bad.
      // The value was calculated externally using a python script
      expect(received).toBeCloseTo(0.71148, 1);
    });
    test("(beta(alpha=2, beta=5) + uniform(low=9, high=10)).cdf(10)", () => {
      const received = unpackResult(
        algebraicAdd(betaDist, uniformDist, { env })
      ).cdf(1e1);

      // This is nondeterministic, we could be in a situation where ci fails but you click rerun and it passes, which is bad.
      // The value was calculated externally using a python script
      expect(received).toBeCloseTo(0.71148, 1);
    });
  });

  describe("inv", () => {
    test.each([5e-2, 4.2e-3, 9e-3])(
      "(normal(mean=5) + normal(mean=5)).inv (imprecise)",
      (x) => {
        const received = normalDist10.inv(x);

        const calculated = unpackResult(
          algebraicAdd(normalDist5, normalDist5, { env })
        ).inv(x);

        expect(received).toBeCloseTo(calculated, -1);
      }
    );
    test("(normal(mean=10) + normal(mean=10)).inv(1e-1)", () => {
      const received = normalDist20.inv(1e-1);

      const calculated = unpackResult(
        algebraicAdd(normalDist10, normalDist10, { env })
      ).inv(1e-1);

      expect(received).toBeCloseTo(calculated, -1);
    });
    test("(uniform(low=9, high=10) + beta(alpha=2, beta=5)).inv(2e-2)", () => {
      const received = unpackResult(
        algebraicAdd(uniformDist, betaDist, { env })
      ).inv(2e-2);

      // This is nondeterministic, we could be in a situation where ci fails but you click rerun and it passes, which is bad.
      // sometimes it works with ~digits=2.
      expect(received).toBeCloseTo(9.179319623146968, 0);
    });
    test("(beta(alpha=2, beta=5) + uniform(low=9, high=10)).inv(2e-2)", () => {
      const received = unpackResult(
        algebraicAdd(betaDist, uniformDist, { env })
      ).inv(2e-2);

      // This is nondeterministic, we could be in a situation where ci fails but you click rerun and it passes, which is bad.
      // sometimes it works with ~digits=2.
      expect(received).toBeCloseTo(9.190872365862756, 0);
    });
  });
});
