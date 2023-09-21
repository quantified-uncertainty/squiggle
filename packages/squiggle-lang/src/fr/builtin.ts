import { makeDefinition } from "../library/registry/fnDefinition.js";
import {
  frAny,
  frArray,
  frBool,
  frNumber,
  frString,
} from "../library/registry/frTypes.js";
import { FnFactory } from "../library/registry/helpers.js";
import { vArray, vBool, vString } from "../value/index.js";

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
  maker.nn2b({ name: "equal", fn: (x, y) => x === y }), // infix == on numbers
  maker.bb2b({ name: "equal", fn: (x, y) => x === y }), // infix == on booleans
  maker.ss2b({ name: "equal", fn: (x, y) => x === y }), // infix == on strings
  maker.nn2b({ name: "unequal", fn: (x, y) => x !== y }), // infix != on numbers
  maker.bb2b({ name: "unequal", fn: (x, y) => x !== y }), // infix != on booleans
  maker.ss2b({ name: "unequal", fn: (x, y) => x !== y }), // infix != on strings
  maker.nn2b({ name: "smaller", fn: (x, y) => x < y }), // infix <
  maker.nn2b({ name: "smallerEq", fn: (x, y) => x <= y }), // infix <=
  maker.nn2b({ name: "larger", fn: (x, y) => x > y }), // infix >
  maker.nn2b({ name: "largerEq", fn: (x, y) => x >= y }), // infix >=
  maker.bb2b({ name: "or", fn: (x, y) => x || y }), // infix ||
  maker.bb2b({ name: "and", fn: (x, y) => x && y }), // infix &&
  maker.n2n({ name: "unaryMinus", fn: (x) => -x }), // unary prefix -
  maker.make({
    name: "not",
    definitions: [
      makeDefinition([frNumber], ([x]) => {
        // unary prefix !
        return vBool(x !== 0);
      }),
      makeDefinition([frBool], ([x]) => {
        // unary prefix !
        return vBool(!x);
      }),
    ],
  }),
  maker.make({
    name: "concat",
    definitions: [
      makeDefinition([frString, frString], ([a, b]) => {
        return vString(a + b);
      }),
      makeDefinition([frArray(frAny), frArray(frAny)], ([a, b]) => {
        return vArray([...a, ...b]);
      }),
      makeDefinition([frString, frAny], ([a, b]) => {
        return vString(a + b.toString());
      }),
    ],
  }),
  maker.make({
    name: "add",
    definitions: [
      makeDefinition([frString, frAny], ([a, b]) => {
        return vString(a + b.toString());
      }),
    ],
  }),
  maker.make({
    name: "inspect",
    definitions: [
      makeDefinition([frAny], ([value]) => {
        console.log(value.toString());
        return value;
      }),
      makeDefinition([frAny, frString], ([value, label]) => {
        console.log(`${label}: ${value.toString()}`);
        return value;
      }),
    ],
  }),
  maker.make({
    name: "typeOf",
    definitions: [
      makeDefinition([frAny], ([v]) => {
        return vString(v.type);
      }),
    ],
  }),
  maker.make({
    name: "javascriptraise",
    definitions: [
      makeDefinition([frAny], ([msg]) => {
        throw new Error(msg.toString());
      }),
    ],
  }),
];
