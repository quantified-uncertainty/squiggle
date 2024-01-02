import { makeDefinition } from "../library/registry/fnDefinition.js";
import { frDuration, frNumber } from "../library/registry/frTypes.js";
import {
  FnFactory,
  makeNumericComparisons,
} from "../library/registry/helpers.js";
import { SDuration } from "../utility/SDuration.js";

const maker = new FnFactory({
  nameSpace: "Duration",
  requiresNamespace: false,
});

const makeNumberToDurationFn = (
  name: string,
  displaySection: string,
  isUnit: boolean,
  fn: (v: number) => SDuration
) =>
  maker.make({
    name,
    examples: [`Duration.${name}(5)`],
    output: "Duration",
    definitions: [makeDefinition([frNumber], frDuration, ([t]) => fn(t))],
    isUnit,
    displaySection,
  });

const makeDurationToNumberFn = (
  name: string,
  displaySection: string,
  fn: (v: SDuration) => number
) =>
  maker.make({
    name,
    examples: [`Duration.${name}(5minutes)`],
    output: "Number",
    displaySection,
    definitions: [makeDefinition([frDuration], frNumber, ([t]) => fn(t))],
  });

export const library = [
  makeNumberToDurationFn(
    "fromMinutes",
    "Constructors",
    false,
    SDuration.fromMinutes
  ),
  makeNumberToDurationFn(
    "fromHours",
    "Constructors",
    false,
    SDuration.fromHours
  ),
  makeNumberToDurationFn("fromDays", "Constructors", false, SDuration.fromDays),
  makeNumberToDurationFn(
    "fromYears",
    "Constructors",
    false,
    SDuration.fromYears
  ),
  ...makeNumericComparisons(
    maker,
    (d1, d2) => d1.smaller(d2),
    (d1, d2) => d1.larger(d2),
    (d1, d2) => d1.isEqual(d2),
    frDuration,
    "Comparison"
  ),
  maker.make({
    name: "unaryMinus",
    output: "Duration",
    examples: ["-5minutes"],
    displaySection: "Algebra",
    definitions: [
      makeDefinition([frDuration], frDuration, ([d]) => d.multiply(-1)),
    ],
  }),
  maker.make({
    name: "add",
    output: "Duration",
    examples: ["5minutes + 10minutes"],
    displaySection: "Algebra",
    definitions: [
      makeDefinition([frDuration, frDuration], frDuration, ([d1, d2]) =>
        d1.add(d2)
      ),
    ],
  }),
  maker.make({
    name: "subtract",
    output: "Duration",
    examples: ["5minutes - 10minutes"],
    displaySection: "Algebra",
    definitions: [
      makeDefinition([frDuration, frDuration], frDuration, ([d1, d2]) =>
        d1.subtract(d2)
      ),
    ],
  }),
  maker.make({
    name: "multiply",
    output: "Duration",
    examples: ["5minutes * 10", "10 * 5minutes"],
    displaySection: "Algebra",
    definitions: [
      makeDefinition([frDuration, frNumber], frDuration, ([d1, d2]) =>
        d1.multiply(d2)
      ),
      makeDefinition([frNumber, frDuration], frDuration, ([d1, d2]) =>
        d2.multiply(d1)
      ),
    ],
  }),
  maker.make({
    name: "divide",
    output: "Number",
    displaySection: "Algebra",
    examples: ["5minutes / 2minutes"],
    definitions: [
      makeDefinition([frDuration, frDuration], frNumber, ([d1, d2]) =>
        d1.divideBySDuration(d2)
      ),
    ],
  }),
  maker.make({
    name: "divide",
    output: "Duration",
    displaySection: "Algebra",
    examples: ["5minutes / 3"],
    definitions: [
      makeDefinition([frDuration, frNumber], frDuration, ([d1, d2]) =>
        d1.divideByNumber(d2)
      ),
    ],
  }),

  makeDurationToNumberFn("toMinutes", "Conversions", (d) => d.toMinutes()),
  makeDurationToNumberFn("toHours", "Conversions", (d) => d.toHours()),
  makeDurationToNumberFn("toDays", "Conversions", (d) => d.toDays()),
  makeDurationToNumberFn("toYears", "Conversions", (d) => d.toYears()),

  makeNumberToDurationFn(
    "fromUnit_minutes",
    "Conversions",
    true,
    SDuration.fromMinutes
  ),
  makeNumberToDurationFn(
    "fromUnit_hours",
    "Conversions",
    true,
    SDuration.fromHours
  ),
  makeNumberToDurationFn(
    "fromUnit_days",
    "Conversions",
    true,
    SDuration.fromDays
  ),
  makeNumberToDurationFn(
    "fromUnit_years",
    "Conversions",
    true,
    SDuration.fromYears
  ),
];
