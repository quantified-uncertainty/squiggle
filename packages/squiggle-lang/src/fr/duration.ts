import { PointMass } from "../dist/SymbolicDist.js";
import { makeDefinition } from "../library/registry/fnDefinition.js";
import { frNumber, frDuration } from "../library/registry/frTypes.js";
import { FnFactory } from "../library/registry/helpers.js";
import { SDurationDist, durationUnits } from "../utility/SDuration.js";
import { vDuration, vDist } from "../value/index.js";
import { result } from "../index.js";
import { DistError } from "../dist/DistError.js";
import { REDistributionError } from "../errors/messages.js";

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
const makeNumberToDurationFn1 = (name: string, num: number) =>
  maker.make({
    name,
    examples: [`Duration.${name}(5)`],
    output: "Duration",
    definitions: [
      makeDefinition([frDuration], ([t], { environment }) => {
        return vDuration(
          SDurationDist.fromMs(
            unpackDistResult(
              t.divideBySDuration(
                SDurationDist.fromMs(new PointMass(num)),
                environment
              )
            )
          )
        );
      }),
    ],
  });

const makeNumberToDurationFn2 = (name: string, num: number) =>
  maker.make({
    name,
    examples: [`Duration.${name}(5)`],
    output: "Dist",
    definitions: [
      makeDefinition([frDuration], ([t], { environment }) => {
        return vDist(
          unpackDistResult(
            t.divideBySDuration(
              SDurationDist.fromMs(new PointMass(num)),
              environment
            )
          )
        );
      }),
    ],
  });

export const library = [
  makeNumberToDurationFn1("fromMinutes", durationUnits.Minute),
  makeNumberToDurationFn1("fromHours", durationUnits.Hour),
  makeNumberToDurationFn1("fromDays", durationUnits.Day),
  makeNumberToDurationFn1("fromYears", durationUnits.Year),
  makeNumberToDurationFn1("fromUnit_minutes", durationUnits.Minute),
  makeNumberToDurationFn1("fromUnit_hours", durationUnits.Hour),
  makeNumberToDurationFn1("fromUnit_days", durationUnits.Day),
  makeNumberToDurationFn1("fromUnit_years", durationUnits.Year),
  // maker.make({
  //   name: "unaryMinus",
  //   output: "Duration",
  //   examples: ["-5minutes"],
  //   definitions: [
  //     makeDefinition([frDuration], ([d]) => vDuration(d.multiply(-1))),
  //   ],
  // }),
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
      makeDefinition([frNumber, frDuration], ([d1, d2], { environment }) =>
        vDuration(unpackDistResult(d2.multiply(new PointMass(d1), environment)))
      ),
      makeDefinition([frDuration, frNumber], ([d1, d2], { environment }) =>
        vDuration(unpackDistResult(d1.multiply(new PointMass(d2), environment)))
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
      makeDefinition([frDuration, frNumber], ([d1, d2], { environment }) =>
        vDuration(
          unpackDistResult(d1.divideByNumber(new PointMass(d2), environment))
        )
      ),
    ],
  }),

  makeNumberToDurationFn2("toMinutes", durationUnits.Minute),
  makeNumberToDurationFn2("toHours", durationUnits.Hour),
  makeNumberToDurationFn2("toDays", durationUnits.Day),
  makeNumberToDurationFn2("toYears", durationUnits.Year),
];
