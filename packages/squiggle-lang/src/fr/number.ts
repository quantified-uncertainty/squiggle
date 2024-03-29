import { REArgumentError } from "../errors/messages.js";
import { makeFnExample } from "../library/registry/core.js";
import { makeDefinition } from "../library/registry/fnDefinition.js";
import {
  frArray,
  frBool,
  frDomain,
  frNamed,
  frNumber,
} from "../library/registry/frTypes.js";
import {
  FnFactory,
  makeNumericComparisons,
} from "../library/registry/helpers.js";
import * as E_A_Floats from "../utility/E_A_Floats.js";
import { NumericRangeDomain } from "../value/domain.js";

const maker = new FnFactory({
  nameSpace: "Number",
  requiresNamespace: false,
});

const assertIsNotEmpty = (arr: readonly number[]) => {
  if (arr.length === 0) {
    throw new REArgumentError("List is empty");
  }
};

function makeNumberArrayToNumberDefinition(
  fn: (arr: readonly number[]) => number,
  throwIfEmpty = true
) {
  return makeDefinition([frArray(frNumber)], frNumber, ([arr]) => {
    throwIfEmpty && assertIsNotEmpty(arr);
    return fn(arr);
  });
}

function makeNumberArrayToNumberArrayDefinition(
  fn: (arr: readonly number[]) => number[],
  throwIfEmpty = true
) {
  return makeDefinition([frArray(frNumber)], frArray(frNumber), ([arr]) => {
    throwIfEmpty && assertIsNotEmpty(arr);
    return fn(arr);
  });
}

export const library = [
  ...makeNumericComparisons(
    maker,
    (d1, d2) => d1 < d2,
    (d1, d2) => d1 > d2,
    (d1, d2) => d1 === d2,
    frNumber,
    "Comparison"
  ),
  maker.nn2n({
    name: "add",
    displaySection: "Algebra (Number)",
    fn: (x, y) => x + y,
  }),
  maker.nn2n({
    name: "subtract",
    displaySection: "Algebra (Number)",
    fn: (x, y) => x - y,
  }),
  maker.nn2n({
    name: "multiply",
    displaySection: "Algebra (Number)",
    fn: (x, y) => x * y,
  }),
  maker.nn2n({
    name: "divide",
    displaySection: "Algebra (Number)",
    fn: (x, y) => x / y,
  }),
  maker.nn2n({
    name: "pow",
    displaySection: "Algebra (Number)",
    fn: (x, y) => Math.pow(x, y),
  }),
  maker.n2n({
    name: "unaryMinus",
    displaySection: "Functions (Number)",
    examples: [makeFnExample(`exp(3.5)`)],
    fn: (x) => -x,
  }),
  maker.n2n({
    name: "exp",
    displaySection: "Functions (Number)",
    description: "exponent",
    examples: [makeFnExample(`exp(3.5)`)],
    fn: Math.exp,
  }),
  maker.n2n({
    name: "log",
    displaySection: "Functions (Number)",
    examples: [makeFnExample(`log(3.5)`)],
    fn: Math.log,
  }),
  maker.n2n({
    name: "log10",
    displaySection: "Functions (Number)",
    examples: [makeFnExample(`log10(3.5)`)],
    fn: Math.log10,
  }),
  maker.n2n({
    name: "log2",
    displaySection: "Functions (Number)",
    examples: [makeFnExample(`log2(3.5)`)],
    fn: Math.log2,
  }),
  maker.n2n({
    name: "floor",
    displaySection: "Functions (Number)",
    examples: [makeFnExample(`floor(3.5)`)],
    fn: Math.floor,
  }),
  maker.n2n({
    name: "ceil",
    displaySection: "Functions (Number)",
    examples: [makeFnExample("ceil(3.5)")],
    fn: Math.ceil,
  }),
  maker.n2n({
    name: "abs",
    displaySection: "Functions (Number)",
    description: "absolute value",
    examples: [makeFnExample(`abs(3.5)`)],
    fn: Math.abs,
  }),
  maker.n2n({
    name: "round",
    displaySection: "Functions (Number)",
    examples: [makeFnExample(`round(3.5)`)],
    fn: Math.round,
  }),
  maker.make({
    name: "not",
    displaySection: "Function (Number)",
    examples: [makeFnExample(`not(3.5)`)],
    definitions: [
      makeDefinition([frNumber], frBool, ([x]) => {
        // unary prefix !
        return x === 0;
      }),
    ],
  }),
  maker.make({
    name: "sum",
    displaySection: "Algebra (List)",
    examples: [makeFnExample(`sum([3,5,2])`)],
    definitions: [
      makeNumberArrayToNumberDefinition((arr) => E_A_Floats.sum(arr), false),
    ],
  }),
  maker.make({
    name: "product",
    displaySection: "Algebra (List)",
    examples: [makeFnExample(`product([3,5,2])`)],
    definitions: [
      makeNumberArrayToNumberDefinition(
        (arr) => E_A_Floats.product(arr),
        false
      ),
    ],
  }),
  maker.make({
    name: "min",
    displaySection: "Functions (List)",
    examples: [makeFnExample(`min([3,5,2])`)],
    definitions: [
      makeNumberArrayToNumberDefinition((arr) => Math.min(...arr)),
      makeDefinition([frNumber, frNumber], frNumber, ([a, b]) => {
        return Math.min(a, b);
      }),
    ],
  }),
  maker.make({
    name: "max",
    displaySection: "Functions (List)",
    examples: [makeFnExample(`max([3,5,2])`)],
    definitions: [
      makeNumberArrayToNumberDefinition((arr) => Math.max(...arr)),
      makeDefinition([frNumber, frNumber], frNumber, ([a, b]) => {
        return Math.max(a, b);
      }),
    ],
  }),
  maker.make({
    name: "mean",
    displaySection: "Functions (List)",
    examples: [makeFnExample(`mean([3,5,2])`)],
    definitions: [
      makeNumberArrayToNumberDefinition((arr) => E_A_Floats.mean(arr)),
    ],
  }),
  maker.make({
    name: "quantile",
    examples: [makeFnExample(`quantile([1,5,10,40,2,4], 0.3)`)],
    displaySection: "Functions (List)",
    definitions: [
      makeDefinition([frArray(frNumber), frNumber], frNumber, ([arr, i]) => {
        assertIsNotEmpty(arr);
        return E_A_Floats.quantile(arr, i);
      }),
    ],
  }),
  maker.make({
    name: "median",
    examples: [makeFnExample(`median([1,5,10,40,2,4])`)],
    displaySection: "Functions (List)",
    definitions: [
      makeDefinition([frArray(frNumber)], frNumber, ([arr]) => {
        assertIsNotEmpty(arr);
        return E_A_Floats.quantile(arr, 0.5);
      }),
    ],
  }),
  maker.make({
    name: "geomean",
    description: "geometric mean",
    examples: [makeFnExample(`geomean([3,5,2])`)],
    displaySection: "Functions (List)",
    definitions: [
      makeNumberArrayToNumberDefinition((arr) => E_A_Floats.geomean(arr)),
    ],
  }),
  maker.make({
    name: "stdev",
    description: "standard deviation",
    examples: [makeFnExample(`stdev([3,5,2,3,5])`)],
    displaySection: "Functions (List)",
    definitions: [
      makeNumberArrayToNumberDefinition((arr) => E_A_Floats.stdev(arr)),
    ],
  }),
  maker.make({
    name: "variance",
    examples: [makeFnExample(`variance([3,5,2,3,5])`)],
    displaySection: "Functions (List)",
    definitions: [
      makeNumberArrayToNumberDefinition((arr) => E_A_Floats.variance(arr)),
    ],
  }),
  maker.make({
    name: "sort",
    examples: [makeFnExample(`sort([3,5,2,3,5])`)],
    displaySection: "Functions (List)",
    definitions: [
      makeNumberArrayToNumberArrayDefinition(
        (arr) => E_A_Floats.sort(arr),
        false
      ),
    ],
  }),
  maker.make({
    name: "cumsum",
    description: "cumulative sum",
    displaySection: "Algegra (List)",
    examples: [makeFnExample(`cumsum([3,5,2,3,5])`)],
    definitions: [
      makeNumberArrayToNumberArrayDefinition(E_A_Floats.cumSum, false),
    ],
  }),
  maker.make({
    name: "cumprod",
    description: "cumulative product",
    displaySection: "Algebra (List)",
    examples: [makeFnExample(`cumprod([3,5,2,3,5])`)],
    definitions: [
      makeNumberArrayToNumberArrayDefinition(E_A_Floats.cumProd, false),
    ],
  }),
  maker.make({
    name: "diff",
    displaySection: "Algebra (List)",
    examples: [makeFnExample(`diff([3,5,2,3,5])`)],
    definitions: [makeNumberArrayToNumberArrayDefinition(E_A_Floats.diff)],
  }),
  maker.make({
    name: "rangeDomain",
    requiresNamespace: true,
    displaySection: "Utils",
    examples: [makeFnExample("Number.rangeDomain(5, 10)")],
    definitions: [
      makeDefinition(
        [frNamed("min", frNumber), frNamed("max", frNumber)],
        frDomain,
        ([min, max]) => {
          return new NumericRangeDomain(min, max);
        }
      ),
    ],
  }),
];
