import { REArgumentError } from "../errors/messages.js";
import { makeDefinition } from "../library/registry/fnDefinition.js";
import { frArray, frNumber, frDict } from "../library/registry/frTypes.js";
import { FnFactory } from "../library/registry/helpers.js";
import * as E_A_Floats from "../utility/E_A_Floats.js";
import { NumericRangeDomain } from "../value/domain.js";
import { vArray, vDomain, vNumber } from "../value/index.js";

const maker = new FnFactory({
  nameSpace: "Number",
  requiresNamespace: false,
});

const throwEmptyList = (): never => {
  throw new REArgumentError("List is empty");
};

function makeNumberArrayToNumberDefinition(
  fn: (arr: number[]) => number,
  throwIfEmpty = true
) {
  return makeDefinition([frArray(frNumber)], ([arr]) => {
    if (arr.length === 0 && throwIfEmpty) {
      return throwEmptyList();
    }
    return vNumber(fn(arr));
  });
}

function makeNumberArrayToNumberArrayDefinition(
  fn: (arr: number[]) => number[],
  throwIfEmpty = true
) {
  return makeDefinition([frArray(frNumber)], ([arr]) => {
    if (arr.length === 0 && throwIfEmpty) {
      return throwEmptyList();
    }
    return vArray(fn(arr).map(vNumber));
  });
}

export const library = [
  maker.n2n({
    name: "floor",
    examples: [`floor(3.5)`],
    fn: Math.floor,
  }),
  maker.n2n({
    name: "ceil",
    examples: ["ceil(3.5)"],
    fn: Math.ceil,
  }),
  maker.n2n({
    name: "abs",
    description: "absolute value",
    examples: [`abs(3.5)`],
    fn: Math.abs,
  }),
  maker.n2n({
    name: "exp",
    description: "exponent",
    examples: [`exp(3.5)`],
    fn: Math.exp,
  }),
  maker.n2n({
    name: "log",
    examples: [`log(3.5)`],
    fn: Math.log,
  }),
  maker.n2n({
    name: "log10",
    examples: [`log10(3.5)`],
    fn: Math.log10,
  }),
  maker.n2n({
    name: "log2",
    examples: [`log2(3.5)`],
    fn: Math.log2,
  }),
  maker.n2n({
    name: "round",
    examples: [`round(3.5)`],
    fn: Math.round,
  }),
  maker.make({
    name: "sum",
    output: "Number",
    examples: [`sum([3,5,2])`],
    definitions: [
      makeNumberArrayToNumberDefinition((arr) => E_A_Floats.sum(arr), false),
    ],
  }),
  maker.make({
    name: "product",
    output: "Number",
    examples: [`product([3,5,2])`],
    definitions: [
      makeNumberArrayToNumberDefinition(
        (arr) => E_A_Floats.product(arr),
        false
      ),
    ],
  }),
  maker.make({
    name: "min",
    output: "Number",
    examples: [`min([3,5,2])`],
    definitions: [makeNumberArrayToNumberDefinition((arr) => Math.min(...arr))],
  }),
  maker.make({
    name: "max",
    output: "Number",
    examples: [`max([3,5,2])`],
    definitions: [makeNumberArrayToNumberDefinition((arr) => Math.max(...arr))],
  }),
  maker.make({
    name: "mean",
    output: "Number",
    examples: [`mean([3,5,2])`],
    definitions: [
      makeNumberArrayToNumberDefinition((arr) => E_A_Floats.mean(arr)),
    ],
  }),
  maker.make({
    name: "geomean",
    description: "geometric mean",
    output: "Number",
    examples: [`geomean([3,5,2])`],
    definitions: [
      makeNumberArrayToNumberDefinition((arr) => E_A_Floats.geomean(arr)),
    ],
  }),
  maker.make({
    name: "stdev",
    description: "standard deviation",
    output: "Number",
    examples: [`stdev([3,5,2,3,5])`],
    definitions: [
      makeNumberArrayToNumberDefinition((arr) => E_A_Floats.stdev(arr)),
    ],
  }),
  maker.make({
    name: "variance",
    output: "Number",
    examples: [`variance([3,5,2,3,5])`],
    definitions: [
      makeNumberArrayToNumberDefinition((arr) => E_A_Floats.variance(arr)),
    ],
  }),
  maker.make({
    name: "sort",
    output: "Array",
    examples: [`sort([3,5,2,3,5])`],
    definitions: [
      makeNumberArrayToNumberArrayDefinition(
        (arr) => E_A_Floats.sort(arr),
        false
      ),
    ],
  }),
  maker.make({
    name: "cumsum",
    output: "Array",
    description: "cumulative sum",
    examples: [`cumsum([3,5,2,3,5])`],
    definitions: [
      makeNumberArrayToNumberArrayDefinition(E_A_Floats.cumSum, false),
    ],
  }),
  maker.make({
    name: "cumprod",
    description: "cumulative product",
    output: "Array",
    examples: [`cumprod([3,5,2,3,5])`],
    definitions: [
      makeNumberArrayToNumberArrayDefinition(E_A_Floats.cumProd, false),
    ],
  }),
  maker.make({
    name: "diff",
    output: "Array",
    examples: [`diff([3,5,2,3,5])`],
    definitions: [makeNumberArrayToNumberArrayDefinition(E_A_Floats.diff)],
  }),
  maker.make({
    name: "rangeDomain",
    requiresNamespace: true,
    output: "Domain",
    examples: ["Number.rangeDomain({ min: 5, max: 10 })"],
    definitions: [
      makeDefinition(
        [frDict(["min", frNumber], ["max", frNumber])],
        ([{ min, max }]) => {
          return vDomain(new NumericRangeDomain(min, max));
        }
      ),
    ],
  }),
];
