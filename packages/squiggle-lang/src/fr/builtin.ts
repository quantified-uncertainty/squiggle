import { makeDefinition } from "../library/registry/fnDefinition.js";
import {
  frAny,
  frArray,
  frBool,
  frGeneric,
  frNumber,
  frString,
} from "../library/registry/frTypes.js";
import {
  FnFactory,
  makeNumericComparisons,
} from "../library/registry/helpers.js";
import { isEqual } from "../value/index.js";

const maker = new FnFactory({
  nameSpace: "", // no namespaced versions
  requiresNamespace: false,
});

export const library = [
  maker.nn2n({ name: "add", fn: (x, y) => x + y }), // infix + (see Reducer/Reducer_Peggy/helpers.ts)
  maker.ss2s({ name: "add", fn: (x, y) => x + y }), // infix + on strings
  maker.nn2n({ name: "subtract", fn: (x, y) => x - y }), // infix -
  maker.nn2n({ name: "multiply", fn: (x, y) => x * y }), // infix *
  maker.nn2n({ name: "divide", fn: (x, y) => x / y }), // infix /
  maker.nn2n({ name: "pow", fn: (x, y) => Math.pow(x, y) }), // infix ^
  ...makeNumericComparisons(
    maker,
    (d1, d2) => d1 < d2,
    (d1, d2) => d1 > d2,
    (d1, d2) => d1 === d2,
    frNumber
  ),
  maker.bb2b({ name: "or", fn: (x, y) => x || y }), // infix ||
  maker.bb2b({ name: "and", fn: (x, y) => x && y }), // infix &&
  maker.n2n({ name: "unaryMinus", fn: (x) => -x }), // unary prefix -
  maker.make({
    name: "not",
    definitions: [
      makeDefinition([frNumber], frBool, ([x]) => {
        // unary prefix !
        return x === 0;
      }),
      makeDefinition([frBool], frBool, ([x]) => {
        // unary prefix !
        return !x;
      }),
    ],
  }),
  maker.make({
    name: "concat",
    definitions: [
      makeDefinition([frString, frString], frString, ([a, b]) => {
        return a + b;
      }),
      makeDefinition(
        [frArray(frAny), frArray(frAny)],
        frArray(frAny),
        ([a, b]) => {
          return [...a, ...b];
        }
      ),
      makeDefinition([frString, frAny], frString, ([a, b]) => {
        return a + b.toString();
      }),
    ],
  }),
  maker.make({
    name: "add",
    definitions: [
      makeDefinition([frString, frAny], frString, ([a, b]) => {
        return a + b.toString();
      }),
    ],
  }),
  maker.make({
    name: "equal",
    definitions: [
      makeDefinition([frAny, frAny], frBool, ([a, b]) => {
        return isEqual(a, b);
      }),
    ],
  }),
  maker.make({
    name: "unequal",
    definitions: [
      makeDefinition([frAny, frAny], frBool, ([a, b]) => {
        return !isEqual(a, b);
      }),
    ],
  }),
  maker.make({
    name: "typeOf",
    definitions: [
      makeDefinition([frAny], frString, ([v]) => {
        return v.publicName;
      }),
    ],
  }),
  maker.make({
    name: "inspect",
    definitions: [
      makeDefinition([frGeneric("A")], frGeneric("A"), ([value]) => {
        console.log(value);
        return value;
      }),
      makeDefinition(
        [frGeneric("A"), frString],
        frGeneric("A"),
        ([value, label]) => {
          console.log(`${label}: ${value.toString()}`);
          return value;
        }
      ),
    ],
  }),
];
