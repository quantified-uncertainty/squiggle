import { FnDefinition, makeDefinition } from "../library/registry/fnDefinition";
import { frArray, frNumber } from "../library/registry/frTypes";
import { FnFactory } from "../library/registry/helpers";
import * as Result from "../utility/result";
import * as E_A_Floats from "../utility/E_A_Floats";
import { Ok } from "../utility/result";
import { Value, vArray, vNumber } from "../value";
import { ErrorMessage, REOther } from "../reducer/ErrorMessage";

const maker = new FnFactory({
  nameSpace: "Number",
  requiresNamespace: false,
});

const emptyList = (): Result.result<Value, ErrorMessage> =>
  Result.Error(REOther("List is empty"));

const makeNumberArrayToNumberDefinition = (
  name: string,
  fn: (arr: number[]) => number
): FnDefinition => {
  return makeDefinition(name, [frArray(frNumber)], ([arr]) => {
    if (arr.length === 0) {
      return emptyList();
    }
    return Ok(vNumber(fn(arr)));
  });
};

const makeNumberArrayToNumberArrayDefinition = (
  name: string,
  fn: (arr: number[]) => number[]
): FnDefinition => {
  return makeDefinition(name, [frArray(frNumber)], ([arr]) => {
    if (arr.length === 0) {
      return emptyList();
    }
    return Ok(vArray(fn(arr).map(vNumber)));
  });
};

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
      makeNumberArrayToNumberDefinition("sum", (arr) => E_A_Floats.sum(arr)),
    ],
  }),
  maker.make({
    name: "product",
    output: "Number",
    examples: [`product([3,5,2])`],
    definitions: [
      makeNumberArrayToNumberDefinition("product", (arr) =>
        E_A_Floats.product(arr)
      ),
    ],
  }),
  maker.make({
    name: "min",
    output: "Number",
    examples: [`min([3,5,2])`],
    definitions: [
      makeNumberArrayToNumberDefinition("min", (arr) => Math.min(...arr)),
    ],
  }),
  maker.make({
    name: "max",
    output: "Number",
    examples: [`max([3,5,2])`],
    definitions: [
      makeNumberArrayToNumberDefinition("max", (arr) => Math.max(...arr)),
    ],
  }),
  maker.make({
    name: "mean",
    output: "Number",
    examples: [`mean([3,5,2])`],
    definitions: [
      makeNumberArrayToNumberDefinition("mean", (arr) => E_A_Floats.mean(arr)),
    ],
  }),
  maker.make({
    name: "geomean",
    description: "geometric mean",
    output: "Number",
    examples: [`geomean([3,5,2])`],
    definitions: [
      makeNumberArrayToNumberDefinition("geomean", (arr) =>
        E_A_Floats.geomean(arr)
      ),
    ],
  }),
  maker.make({
    name: "stdev",
    description: "standard deviation",
    output: "Number",
    examples: [`stdev([3,5,2,3,5])`],
    definitions: [
      makeNumberArrayToNumberDefinition("stdev", (arr) =>
        E_A_Floats.stdev(arr)
      ),
    ],
  }),
  maker.make({
    name: "variance",
    output: "Number",
    examples: [`variance([3,5,2,3,5])`],
    definitions: [
      makeNumberArrayToNumberDefinition("variance", (arr) =>
        E_A_Floats.variance(arr)
      ),
    ],
  }),
  maker.make({
    name: "sort",
    output: "Array",
    examples: [`sort([3,5,2,3,5])`],
    definitions: [
      makeNumberArrayToNumberArrayDefinition("sort", (arr) =>
        E_A_Floats.sort(arr)
      ),
    ],
  }),
  maker.make({
    name: "cumsum",
    output: "Array",
    description: "cumulative sum",
    examples: [`cumsum([3,5,2,3,5])`],
    definitions: [
      makeNumberArrayToNumberArrayDefinition("cumsum", E_A_Floats.cumSum),
    ],
  }),
  maker.make({
    name: "cumprod",
    description: "cumulative product",
    output: "Array",
    examples: [`cumprod([3,5,2,3,5])`],
    definitions: [
      makeNumberArrayToNumberArrayDefinition("cumprod", E_A_Floats.cumProd),
    ],
  }),
  maker.make({
    name: "diff",
    output: "Array",
    examples: [`diff([3,5,2,3,5])`],
    definitions: [
      makeNumberArrayToNumberArrayDefinition("diff", E_A_Floats.diff),
    ],
  }),
];
