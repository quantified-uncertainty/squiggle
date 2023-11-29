import { PointMass } from "../dist/SymbolicDist.js";
import { makeDefinition } from "../library/registry/fnDefinition.js";
import { frDuration, frDistOrNumber } from "../library/registry/frTypes.js";
import {
  FnFactory,
  parseDistFromDistOrNumber,
  twoVarSample,
} from "../library/registry/helpers.js";
import * as SymbolicDist from "../dist/SymbolicDist.js";
import { SDurationDist } from "../utility/SDuration.js";
import { vDuration, vDist, vDate } from "../value/index.js";
import { result } from "../index.js";
import { DistError, argumentError } from "../dist/DistError.js";
import { REDistributionError } from "../errors/messages.js";
import { BaseDist } from "../dist/BaseDist.js";
import { Duration, DurationUnit } from "../utility/durationUnit.js";

const maker = new FnFactory({
  nameSpace: "Duration",
  requiresNamespace: false,
});

export function unpackDistResult<T>(result: result<T, DistError>): T {
  if (!result.ok) {
    throw new REDistributionError(result.value);
  }
  return result.value;
}
const makeNumberToDurationFn1 = (name: string, unit: DurationUnit) =>
  maker.make({
    name,
    examples: [`Duration.${name}(5)`],
    output: "Duration",
    definitions: [
      makeDefinition([frDistOrNumber], ([t], { environment }) => {
        const dist = t instanceof BaseDist ? t : new PointMass(t);
        return vDuration(
          unpackDistResult(
            SDurationDist.fromMs(dist).multiply(
              new PointMass(Duration.toUnitConversionFactor("ms", unit)),
              environment
            )
          )
        );
      }),
    ],
  });

const makeNumberToDurationFn2 = (name: string, unit: DurationUnit) =>
  maker.make({
    name,
    examples: [`Duration.${name}(5)`],
    output: "Dist",
    definitions: [
      makeDefinition([frDuration], ([t], { environment }) => {
        return vDist(
          unpackDistResult(
            t.divideBySDuration(
              SDurationDist.fromMs(
                new PointMass(Duration.toUnitConversionFactor("ms", unit))
              ),
              environment
            )
          )
        );
      }),
    ],
  });

export const library = [
  makeNumberToDurationFn1("minutes", "minute"),
  makeNumberToDurationFn1("hours", "hour"),
  makeNumberToDurationFn1("days", "day"),
  makeNumberToDurationFn1("years", "year"),

  makeNumberToDurationFn1("fromUnit_minutes", "minute"),
  makeNumberToDurationFn1("fromUnit_hours", "hour"),
  makeNumberToDurationFn1("fromUnit_days", "day"),
  makeNumberToDurationFn1("fromUnit_years", "year"),
  // maker.make({
  //   name: "unaryMinus",
  //   output: "Duration",
  //   examples: ["-5minutes"],
  //   definitions: [
  //     makeDefinition([frDuration], ([d]) => vDuration(d.multiply(-1))),
  //   ],
  // }),
  maker.make({
    name: "to",
    output: "Date",
    definitions: [
      makeDefinition([frDuration, frDuration], ([v1, v2], { environment }) => {
        const foo = twoVarSample(
          v1.toMs(),
          v2.toMs(),
          environment,
          (low, high) => {
            if (low >= high) {
              throw new REDistributionError(
                argumentError("Low value must be less than high value")
              );
            } else if (low <= 0 || high <= 0) {
              throw new REDistributionError(
                argumentError(
                  `The "to" function only accepts paramaters above 0. It's a shorthand for lognormal({p5:min, p95:max}), which is only valid with positive entries for then minimum and maximum. If you would like to use a normal distribution, which accepts values under 0, you can use it like this: normal({p5:${low}, p95:${high}}).`
                )
              );
            }
            return SymbolicDist.Lognormal.fromCredibleInterval({
              low,
              high,
              probability: 0.9,
            });
          }
        );
        // re
        return vDuration(SDurationDist.fromMs(foo));
      }),
    ],
  }),
  maker.make({
    name: "add",
    output: "Duration",
    examples: ["5minutes + 10minutes"],
    definitions: [
      makeDefinition([frDuration, frDuration], ([d1, d2], { environment }) =>
        vDuration(unpackDistResult(d1.add(d2, environment)))
      ),
    ],
  }),
  maker.make({
    name: "subtract",
    output: "Duration",
    examples: ["5minutes - 10minutes"],
    definitions: [
      makeDefinition([frDuration, frDuration], ([d1, d2], { environment }) =>
        vDuration(unpackDistResult(d1.subtract(d2, environment)))
      ),
    ],
  }),
  maker.make({
    name: "multiply",
    output: "Duration",
    examples: ["5minutes * 10", "10 * 5minutes"],
    definitions: [
      //change, number -> DistOrNumber
      makeDefinition(
        [frDistOrNumber, frDuration],
        ([d1, d2], { environment }) =>
          vDuration(
            unpackDistResult(
              d2.multiply(parseDistFromDistOrNumber(d1), environment)
            )
          )
      ),
      makeDefinition(
        [frDuration, frDistOrNumber],
        ([d1, d2], { environment }) =>
          vDuration(
            unpackDistResult(
              d1.multiply(parseDistFromDistOrNumber(d2), environment)
            )
          )
      ),
    ],
  }),
  maker.make({
    name: "divide",
    output: "Number",
    examples: ["5minutes / 2minutes"],
    definitions: [
      makeDefinition([frDuration, frDuration], ([d1, d2], { environment }) =>
        vDist(unpackDistResult(d1.divideBySDuration(d2, environment)))
      ),
    ],
  }),
  maker.make({
    name: "divide",
    output: "Duration",
    examples: ["5minutes / 3"],
    definitions: [
      makeDefinition(
        [frDuration, frDistOrNumber],
        ([d1, d2], { environment }) =>
          vDuration(
            unpackDistResult(
              d1.divideByNumber(parseDistFromDistOrNumber(d2), environment)
            )
          )
      ),
    ],
  }),

  makeNumberToDurationFn2("toMinutes", "minute"),
  makeNumberToDurationFn2("toHours", "hour"),
  makeNumberToDurationFn2("toDays", "day"),
  makeNumberToDurationFn2("toYears", "year"),
];
