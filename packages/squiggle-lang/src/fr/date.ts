import { DistError } from "../dist/DistError.js";
import { REDistributionError, REOther } from "../errors/messages.js";
import { result } from "../index.js";
import { makeDefinition } from "../library/registry/fnDefinition.js";
import {
  frDate,
  frDict,
  frNumber,
  frString,
  frDuration,
  frDateNumber,
} from "../library/registry/frTypes.js";
import {
  FnFactory,
  makeNumericComparisons,
} from "../library/registry/helpers.js";
import { SDateNumber, SDateDist } from "../utility/SDate.js";
import { getExt, getExtFn } from "../utility/result.js";
import { DateRangeDomain } from "../value/domain.js";
import { vDate, vDateNumber, vDomain, vDuration } from "../value/index.js";

const maker = new FnFactory({
  nameSpace: "Date",
  requiresNamespace: false,
});

const makeYearFn = makeDefinition([frNumber], ([year]) => {
  const result = SDateNumber.fromYear(year);
  const value = getExtFn(result, (e) => new REOther(e));
  return vDateNumber(value);
});
export function unpackDistResult<T>(result: result<T, DistError>): T {
  if (!result.ok) {
    throw new REDistributionError(result.value);
  }
  return result.value;
}
export const library = [
  ...makeNumericComparisons(
    maker,
    (d1, d2) => d1.smaller(d2),
    (d1, d2) => d1.larger(d2),
    (d1, d2) => d1.isEqual(d2),
    frDateNumber
  ),
  maker.make({
    name: "make",
    requiresNamespace: true,
    examples: ['Date.make("2020-05-12")', "Date.make(2020, 5, 10)"],
    output: "DateNumber",
    definitions: [
      makeDefinition([frString], ([str]) => {
        const result = SDateNumber.fromString(str);
        if (!result.ok) {
          throw new REOther(result.value);
        }
        return vDateNumber(result.value);
      }),

      makeDefinition([frNumber, frNumber, frNumber], ([yr, month, date]) => {
        return vDateNumber(SDateNumber.fromYearMonthDay(yr, month, date));
      }),
    ],
  }),
  maker.fromDefinition("fromYear", makeYearFn),
  maker.fromDefinition("fromUnit_year", makeYearFn),
  maker.make({
    name: "subtract",
    examples: ["Date.make(2020, 5, 12) - Date.make(2000, 1, 1)"],
    output: "Duration",
    definitions: [
      makeDefinition([frDate, frDate], ([d1, d2], { environment }) => {
        const result = d1.subtract(d2, environment);
        return vDuration(getExt(result));
      }),
    ],
  }),
  maker.make({
    name: "subtract",
    examples: ["Date.make(2020, 5, 12) - 20years"],
    output: "Date",
    definitions: [
      makeDefinition([frDate, frDuration], ([d1, d2], { environment }) =>
        vDate(unpackDistResult(d1.subtractDuration(d2, environment)))
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
      makeDefinition([frDate, frDuration], ([d1, d2], { environment }) =>
        vDate(unpackDistResult(d1.addDuration(d2, environment)))
      ),
      makeDefinition([frDuration, frDate], ([d1, d2], { environment }) =>
        vDate(unpackDistResult(d2.addDuration(d1, environment)))
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
        [frDict(["min", frDateNumber], ["max", frDateNumber])],
        ([{ min, max }]) => {
          return vDomain(new DateRangeDomain(min, max));
        }
      ),
    ],
  }),
];
