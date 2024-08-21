import { ErrorMessage } from "../errors/messages.js";
import { makeFnExample } from "../library/registry/core.js";
import {
  FnFactory,
  makeNumericComparisons,
} from "../library/registry/helpers.js";
import { makeDefinition } from "../reducer/lambda/FnDefinition.js";
import { namedInput } from "../reducer/lambda/FnInput.js";
import { tDate, tDomain, tDuration, tNumber, tString } from "../types/index.js";
import { TDateRange } from "../types/TDateRange.js";
import { SDate } from "../utility/SDate.js";

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
    tDate,
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
    definitions: [
      makeDefinition([tString], tDate, ([str]) => {
        const result = SDate.fromString(str);
        if (!result.ok) {
          throw ErrorMessage.otherError(result.value);
        }
        return result.value;
      }),

      makeDefinition(
        [
          namedInput("year", tNumber),
          namedInput("month", tNumber),
          namedInput("day", tNumber),
        ],
        tDate,
        ([yr, month, date]) => {
          return SDate.fromYearMonthDay(yr, month, date);
        }
      ),
      makeDefinition([namedInput("year", tNumber)], tDate, ([yr]) => {
        const year = SDate.fromYear(yr);
        if (!year.ok) {
          throw ErrorMessage.otherError(year.value);
        }
        return year.value;
      }),
    ],
  }),
  // same name as used in date-fns
  maker.make({
    name: "fromUnixTime",
    examples: [makeFnExample("Date.fromUnixTime(1589222400)")],
    requiresNamespace: true,
    displaySection: "Conversions",
    definitions: [
      makeDefinition([tNumber], tDate, ([num]) => {
        return SDate.fromUnixS(num);
      }),
    ],
  }),
  maker.make({
    name: "toUnixTime",
    examples: [makeFnExample("Date.toUnixTime(Date.make(2020, 5, 12))")],
    requiresNamespace: true,
    displaySection: "Conversions",
    definitions: [
      makeDefinition([tDate], tNumber, ([date]) => {
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
    displaySection: "Algebra",
    definitions: [
      makeDefinition([tDate, tDate], tDuration, ([d1, d2]) => d1.subtract(d2)),
    ],
  }),
  maker.make({
    name: "subtract",
    examples: [
      makeFnExample("Date.make(2020, 5, 12) - 20years", {
        isInteractive: true,
      }),
    ],
    displaySection: "Algebra",
    definitions: [
      makeDefinition([tDate, tDuration], tDate, ([d1, d2]) =>
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
    displaySection: "Algebra",
    definitions: [
      makeDefinition([tDate, tDuration], tDate, ([d1, d2]) =>
        d1.addDuration(d2)
      ),
      makeDefinition([tDuration, tDate], tDate, ([d1, d2]) =>
        d2.addDuration(d1)
      ),
    ],
  }),
  maker.make({
    name: "rangeDomain",
    requiresNamespace: true,
    examples: [makeFnExample("Date.rangeDomain(Date(2000), Date(2010))")],
    displaySection: "Other",
    definitions: [
      makeDefinition(
        [namedInput("min", tDate), namedInput("min", tDate)],
        tDomain(tDate),
        ([min, max]) => {
          return new TDateRange(min, max);
        }
      ),
    ],
  }),
];
