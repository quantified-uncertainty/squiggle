import { REOther } from "../errors/messages.js";
import { makeDefinition } from "../library/registry/fnDefinition.js";
import {
  frDate,
  frDomain,
  frDuration,
  frNamed,
  frNumber,
  frString,
} from "../library/registry/frTypes.js";
import {
  FnFactory,
  makeNumericComparisons,
} from "../library/registry/helpers.js";
import { SDate } from "../utility/SDate.js";
import { DateRangeDomain } from "../value/domain.js";

const maker = new FnFactory({
  nameSpace: "Date",
  requiresNamespace: false,
});

export const library = [
  maker.make({
    name: "make",
    requiresNamespace: true,
    examples: [
      'Date.make("2020-05-12")',
      "Date.make(2020, 5, 10)",
      "Date.make(2020)",
    ],
    output: "Date",
    definitions: [
      makeDefinition([frString], frDate, ([str]) => {
        const result = SDate.fromString(str);
        if (!result.ok) {
          throw new REOther(result.value);
        }
        return result.value;
      }),

      makeDefinition(
        [
          frNamed("year", frNumber),
          frNamed("month", frNumber),
          frNamed("day", frNumber),
        ],
        frDate,
        ([yr, month, date]) => {
          return SDate.fromYearMonthDay(yr, month, date);
        }
      ),
      makeDefinition([frNamed("year", frNumber)], frDate, ([yr]) => {
        const year = SDate.fromYear(yr);
        if (!year.ok) {
          throw new REOther(year.value);
        }
        return year.value;
      }),
    ],
  }),
  ...makeNumericComparisons(
    maker,
    (d1, d2) => d1.smaller(d2),
    (d1, d2) => d1.larger(d2),
    (d1, d2) => d1.isEqual(d2),
    frDate
  ),
  // same name as used in date-fns
  maker.make({
    name: "fromUnixTime",
    examples: ["Date.fromUnixTime(1589222400)"],
    requiresNamespace: true,
    output: "Date",
    definitions: [
      makeDefinition([frNumber], frDate, ([num]) => {
        return SDate.fromUnixS(num);
      }),
    ],
  }),
  maker.make({
    name: "toUnixTime",
    examples: ["Date.toUnixTime(Date.make(2020, 5, 12))"],
    requiresNamespace: true,
    output: "Number",
    definitions: [
      makeDefinition([frDate], frNumber, ([date]) => {
        return date.toUnixS();
      }),
    ],
  }),
  maker.make({
    name: "subtract",
    examples: ["Date.make(2020, 5, 12) - Date.make(2000, 1, 1)"],
    output: "Duration",
    definitions: [
      makeDefinition([frDate, frDate], frDuration, ([d1, d2]) =>
        d1.subtract(d2)
      ),
    ],
  }),
  maker.make({
    name: "subtract",
    examples: ["Date.make(2020, 5, 12) - 20years"],
    output: "Date",
    definitions: [
      makeDefinition([frDate, frDuration], frDate, ([d1, d2]) =>
        d1.subtractDuration(d2)
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
      makeDefinition([frDate, frDuration], frDate, ([d1, d2]) =>
        d1.addDuration(d2)
      ),
      makeDefinition([frDuration, frDate], frDate, ([d1, d2]) =>
        d2.addDuration(d1)
      ),
    ],
  }),
  maker.make({
    name: "rangeDomain",
    requiresNamespace: true,
    output: "Domain",
    examples: ["Date.rangeDomain(Date(2000), Date(2010))"],
    definitions: [
      makeDefinition(
        [frNamed("min", frDate), frNamed("min", frDate)],
        frDomain,
        ([min, max]) => {
          return new DateRangeDomain(min, max);
        }
      ),
    ],
  }),
];
