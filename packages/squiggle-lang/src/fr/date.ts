import { REOther } from "../errors/messages.js";
import { makeDefinition } from "../library/registry/fnDefinition.js";
import {
  frDate,
  frDict,
  frNumber,
  frString,
  frDuration,
} from "../library/registry/frTypes.js";
import {
  FnFactory,
  makeNumericComparisons,
} from "../library/registry/helpers.js";
import { SDate } from "../utility/SDate.js";
import { DateRangeDomain } from "../value/domain.js";
import { vDate, vDomain, vNumber, vDuration } from "../value/index.js";

const maker = new FnFactory({
  nameSpace: "Date",
  requiresNamespace: false,
});

const makeYearFn = makeDefinition([frNumber], ([year]) => {
  const result = SDate.fromYear(year);
  if (!result.ok) {
    throw new REOther(result.value);
  }
  return vDate(result.value);
});

export const library = [
  ...makeNumericComparisons(
    maker,
    (d1, d2) => d1.smaller(d2),
    (d1, d2) => d1.larger(d2),
    (d1, d2) => d1.isEqual(d2),
    frDate
  ),
  maker.make({
    name: "make",
    requiresNamespace: true,
    examples: ['Date.make("2020-05-12")', "Date.make(2020, 5, 10)"],
    output: "Date",
    definitions: [
      makeDefinition(
        [frString],
        ([str]) => {
          const result = SDate.fromString(str);
          if (!result.ok) {
            throw new REOther(result.value);
          }
          return vDate(result.value);
        },
        frDate
      ),

      makeDefinition(
        [frNumber, frNumber, frNumber],
        ([yr, month, date]) => {
          return vDate(SDate.fromYearMonthDay(yr, month, date));
        },
        frDate
      ),
    ],
  }),
  maker.fromDefinition("fromYear", makeYearFn),
  maker.fromDefinition("fromUnit_year", makeYearFn),
  // same name as used in date-fns
  maker.make({
    name: "fromUnixTime",
    examples: ["Date.fromUnixTime(1589222400)"],
    requiresNamespace: true,
    output: "Date",
    definitions: [
      makeDefinition(
        [frNumber],
        ([num]) => {
          return vDate(SDate.fromUnixS(num));
        },
        frDate
      ),
    ],
  }),
  maker.make({
    name: "toUnixTime",
    examples: ["Date.toUnixTime(Date.make(2020, 5, 12))"],
    requiresNamespace: true,
    output: "Number",
    definitions: [
      makeDefinition(
        [frDate],
        ([date]) => {
          return vNumber(date.toUnixS());
        },
        frNumber
      ),
    ],
  }),
  maker.make({
    name: "subtract",
    examples: ["Date.make(2020, 5, 12) - Date.make(2000, 1, 1)"],
    output: "Duration",
    definitions: [
      makeDefinition(
        [frDate, frDate],
        ([d1, d2]) => vDuration(d1.subtract(d2)),
        frDuration
      ),
    ],
  }),
  maker.make({
    name: "subtract",
    examples: ["Date.make(2020, 5, 12) - 20years"],
    output: "Date",
    definitions: [
      makeDefinition(
        [frDate, frDuration],
        ([d1, d2]) => vDate(d1.subtractDuration(d2)),
        frDate
      ),
    ],
  }),
  maker.make({
    name: "add",
    examples: [
      "Date.make(2020, 5, 12) + 20years",
      "20years + Date.make(2020, 5, 12)",
    ],
    output: "Date",
    definitions: [
      makeDefinition(
        [frDate, frDuration],
        ([d1, d2]) => vDate(d1.addDuration(d2)),
        frDate
      ),
      makeDefinition(
        [frDuration, frDate],
        ([d1, d2]) => vDate(d2.addDuration(d1)),
        frDate
      ),
    ],
  }),
  maker.make({
    name: "rangeDomain",
    requiresNamespace: true,
    output: "Domain",
    examples: ["Date.rangeDomain({ min: 2000year, max: 2010year })"],
    definitions: [
      makeDefinition(
        [frDict(["min", frDate], ["max", frDate])],
        ([{ min, max }]) => {
          return vDomain(new DateRangeDomain(min, max));
        }
      ),
    ],
  }),
];
