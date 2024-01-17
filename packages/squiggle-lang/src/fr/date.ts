import { REOther } from "../errors/messages.js";
import { makeFnExample } from "../library/registry/core.js";
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
  ...makeNumericComparisons(
    maker,
    (d1, d2) => d1.smaller(d2),
    (d1, d2) => d1.larger(d2),
    (d1, d2) => d1.isEqual(d2),
    frDate,
    "Comparison"
  ),
  maker.make({
    name: "make",
    requiresNamespace: true,
    examples: [
      makeFnExample(
        `d1 = Date.make("2020-05-12")
d2 = Date.make(2020, 5, 10)
d3 = Date.make(2020.5)`,
        { useForTests: false }
      ),
    ],
    displaySection: "Constructors",
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
  maker.make({
    name: "now",
    description: `Returns the current date. Internally calls \`\`Date.now()\`\` in JavaScript.  

*Caution: This function, which returns the current date, produces varying outputs with each call. As a result, accurately estimating the value of functions that incorporate \`\`Date.now()\`\` at past time points is challenging. In the future, we intend to implement a feature allowing the input of a simulated time via an environment variable to address this issue.*`,
    examples: [makeFnExample("Date.now()")],
    requiresNamespace: true,
    displaySection: "Constructors",
    output: "Date",
    definitions: [
      makeDefinition([], frDate, () => {
        return SDate.now();
      }),
    ],
  }),
  // same name as used in date-fns
  maker.make({
    name: "fromUnixTime",
    examples: [makeFnExample("Date.fromUnixTime(1589222400)")],
    requiresNamespace: true,
    output: "Date",
    displaySection: "Conversions",
    definitions: [
      makeDefinition([frNumber], frDate, ([num]) => {
        return SDate.fromUnixS(num);
      }),
    ],
  }),
  maker.make({
    name: "toUnixTime",
    examples: [makeFnExample("Date.toUnixTime(Date.make(2020, 5, 12))")],
    requiresNamespace: true,
    displaySection: "Conversions",
    output: "Number",
    definitions: [
      makeDefinition([frDate], frNumber, ([date]) => {
        return date.toUnixS();
      }),
    ],
  }),
  maker.make({
    name: "subtract",
    examples: [
      makeFnExample("Date.make(2020, 5, 12) - Date.make(2000, 1, 1)", {
        isInteractive: true,
      }),
    ],
    output: "Duration",
    displaySection: "Algebra",
    definitions: [
      makeDefinition([frDate, frDate], frDuration, ([d1, d2]) =>
        d1.subtract(d2)
      ),
    ],
  }),
  maker.make({
    name: "subtract",
    examples: [
      makeFnExample("Date.make(2020, 5, 12) - 20years", {
        isInteractive: true,
      }),
    ],
    output: "Date",
    displaySection: "Algebra",
    definitions: [
      makeDefinition([frDate, frDuration], frDate, ([d1, d2]) =>
        d1.subtractDuration(d2)
      ),
    ],
  }),
  maker.make({
    name: "add",
    examples: [
      makeFnExample("Date.make(2020, 5, 12) + 20years"),
      makeFnExample("20years + Date.make(2020, 5, 12)", {
        isInteractive: true,
      }),
    ],
    output: "Date",
    displaySection: "Algebra",
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
    examples: [makeFnExample("Date.rangeDomain(Date(2000), Date(2010))")],
    displaySection: "Other",
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
