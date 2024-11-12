import * as d3format from "d3-format";
import * as d3dateFormat from "d3-time-format";

import { namedInput } from "../library/FrInput.js";
import {
  frAny,
  frArray,
  frDate,
  frNumber,
  frString,
} from "../library/FrType.js";
import { FnFactory } from "../library/registry/helpers.js";
import { makeDefinition } from "../reducer/lambda/FnDefinition.js";

const maker = new FnFactory({
  nameSpace: "String",
  requiresNamespace: true,
});

const fromNumber = makeDefinition(
  [frNumber, frString],
  frString,
  ([number, format]) => d3format.format(format)(number)
);

const fromDate = makeDefinition(
  [frDate, frString],
  frString,
  ([date, format]) => d3dateFormat.timeFormat(format)(date.toDate())
);

export const library = [
  maker.make({
    name: "make",
    description:
      "Converts any value to a string. Some information is often lost. When a number or date is formatted, the format string is optional. This would use [d3-format](https://d3js.org/d3-format) or [d3-time-format](https://d3js.org/d3-time-format) respectively.",
    definitions: [
      makeDefinition([frAny()], frString, ([x]) => x.toString()),
      fromNumber,
      fromDate,
    ],
  }),
  maker.make({
    name: "concat",
    requiresNamespace: false,
    definitions: [
      makeDefinition([frString, frString], frString, ([a, b]) => {
        return a + b;
      }),
      makeDefinition([frString, frAny()], frString, ([a, b]) => {
        return a + b.toString();
      }),
    ],
  }),
  maker.make({
    name: "add",
    requiresNamespace: false,
    definitions: [
      makeDefinition([frString, frString], frString, ([a, b]) => {
        return a + b;
      }),
      makeDefinition([frString, frAny()], frString, ([a, b]) => {
        return a + b.toString();
      }),
    ],
  }),
  maker.make({
    name: "split",
    definitions: [
      makeDefinition(
        [frString, namedInput("separator", frString)],
        frArray(frString),
        ([str, mark]) => {
          return str.split(mark);
        }
      ),
    ],
  }),
];
