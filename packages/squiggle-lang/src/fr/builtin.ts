import { makeDefinition } from "../library/registry/fnDefinition";
import {
  frAny,
  frArray,
  frBool,
  frNumber,
  frString,
} from "../library/registry/frTypes";
import { FnFactory } from "../library/registry/helpers";
import { Ok } from "../utility/result";
import { vArray, vBool, vString } from "../value";

const maker = new FnFactory({
  nameSpace: "", // no namespaced versions
  requiresNamespace: false,
});

export const library = [
  maker.nn2n({ name: "add", fn: (x, y) => x + y }), // infix + (see Reducer/Reducer_Peggy/helpers.ts)
  maker.nn2n({ name: "subtract", fn: (x, y) => x - y }), // infix -
  maker.nn2n({ name: "multiply", fn: (x, y) => x * y }), // infix *
  maker.nn2n({ name: "divide", fn: (x, y) => x / y }), // infix /
  maker.nn2n({ name: "pow", fn: (x, y) => Math.pow(x, y) }), // infix ^
  maker.nn2b({ name: "equal", fn: (x, y) => x === y }), // infix == on numbers
  maker.bb2b({ name: "equal", fn: (x, y) => x === y }), // infix == on booleans
  maker.nn2b({ name: "unequal", fn: (x, y) => x !== y }), // infix != on numbers
  maker.bb2b({ name: "unequal", fn: (x, y) => x !== y }), // infix != on booleans
  maker.nn2b({ name: "smaller", fn: (x, y) => x < y }), // infix <
  maker.nn2b({ name: "smallerEq", fn: (x, y) => x <= y }), // infix <=
  maker.nn2b({ name: "larger", fn: (x, y) => x > y }), // infix >
  maker.nn2b({ name: "largerEq", fn: (x, y) => x >= y }), // infix >=
  maker.bb2b({ name: "or", fn: (x, y) => x || y }), // infix ||
  maker.bb2b({ name: "and", fn: (x, y) => x && y }), // infix &&
  maker.n2n({ name: "unaryMinus", fn: (x) => -x }), // unary prefix -
  ...[
    makeDefinition("not", [frNumber], ([x]) => {
      // unary prefix !
      return Ok(vBool(x !== 0));
    }),
    makeDefinition("not", [frBool], ([x]) => {
      // unary prefix !
      return Ok(vBool(!x));
    }),
    makeDefinition("concat", [frString, frString], ([a, b]) => {
      return Ok(vString(a + b));
    }),
    makeDefinition("concat", [frArray(frAny), frArray(frAny)], ([a, b]) => {
      return Ok(vArray([...a, ...b]));
    }),
    makeDefinition("inspect", [frAny], ([value]) => {
      console.log(value.toString());
      return Ok(value);
    }),
    makeDefinition("inspect", [frAny, frString], ([value, label]) => {
      console.log(`${label}: ${value.toString()}`);
      return Ok(value);
    }),
    makeDefinition("javascriptraise", [frAny], ([msg]) => {
      throw new Error(msg.toString());
    }),
  ].map((d) => maker.fromDefinition(d)),
];
