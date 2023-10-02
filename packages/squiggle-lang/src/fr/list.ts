import { REOther } from "../errors/messages.js";
import { makeDefinition } from "../library/registry/fnDefinition.js";
import * as E_A_Floats from "../utility/E_A_Floats.js";
import {
  frAny,
  frDist,
  frArray,
  frTuple2,
  frLambda,
  frNumber,
  frString,
} from "../library/registry/frTypes.js";
import { FnFactory, doBinaryLambdaCall } from "../library/registry/helpers.js";
import {
  Value,
  vArray,
  vNumber,
  vString,
  vBool,
  uniq,
  uniqBy,
} from "../value/index.js";
import { sampleSetAssert } from "./sampleset.js";
import { unzip, zip } from "../utility/E_A.js";
import {
  makeFromLambda,
  map,
  reduce,
  reduceReverse,
  reduceWhile,
} from "../value/valueList.js";
import { Lambda } from "../reducer/lambda.js";
import { ReducerContext } from "../reducer/context.js";
import { isInteger } from "lodash";

const maker = new FnFactory({
  nameSpace: "List",
  requiresNamespace: true,
});

function _assert1ParamsLength(lambda: Lambda, len: number): void {
  if (lambda.getParameterNames().length !== len) {
    throw new REOther(`Expected function with ${len} parameters`);
  }
}

const _assertValidArrayLength = (number: number) => {
  if (number < 0) {
    throw new REOther("Expected non-negative number");
  } else if (!Number.isInteger(number)) {
    throw new REOther("Number must be an integer");
  }
};
const _assertUnemptyArray = (array: Value[]) => {
  if (array.length === 0) {
    throw new REOther("Array must not be empty");
  }
};

function _binaryLambdaCheck1(
  lambda: Lambda,
  context: ReducerContext
): (e: Value) => boolean {
  return (el: Value) => doBinaryLambdaCall([el], lambda, context);
}

export const library = [
  maker.make({
    name: "make",
    output: "Array",
    examples: [
      `List.make(2, 3)`,
      `List.make(2, {|| 3})`,
      `List.make(2, {|f| f+1})`,
    ],
    definitions: [
      makeDefinition([frNumber, frLambda], ([number, lambda], context) => {
        _assertValidArrayLength(number);
        return vArray(makeFromLambda(number, lambda, context));
      }),
      makeDefinition([frNumber, frAny], ([number, value]) => {
        _assertValidArrayLength(number);
        return vArray(new Array(number).fill(value));
      }),
      makeDefinition([frDist], ([dist]) => {
        sampleSetAssert(dist);
        return vArray(dist.samples.map(vNumber));
      }),
    ],
  }),
  maker.make({
    name: "upTo",
    output: "Array",
    examples: [`List.upTo(1,4)`],
    definitions: [
      makeDefinition([frNumber, frNumber], ([low, high]) => {
        if (!isInteger(low) || !isInteger(high)) {
          throw new Error("upTo() requires integers");
        }
        return vArray(E_A_Floats.upTo(low, high).map(vNumber));
      }),
    ],
  }),
  maker.make({
    name: "length",
    output: "Number",
    examples: [`List.length([1,4,5])`],
    definitions: [
      makeDefinition([frArray(frAny)], ([values]) => vNumber(values.length)),
    ],
  }),
  maker.make({
    name: "first",
    examples: [`List.first([1,4,5])`],
    definitions: [
      makeDefinition([frArray(frAny)], ([array]) => {
        _assertUnemptyArray(array);
        return array[0];
      }),
    ],
  }),
  maker.make({
    name: "last",
    examples: [`List.last([1,4,5])`],
    definitions: [
      makeDefinition([frArray(frAny)], ([array]) => {
        _assertUnemptyArray(array);
        return array[array.length - 1];
      }),
    ],
  }),
  maker.make({
    name: "reverse",
    output: "Array",
    requiresNamespace: false,
    examples: [`List.reverse([1,4,5])`],
    definitions: [
      makeDefinition([frArray(frAny)], ([array]) =>
        vArray([...array].reverse())
      ),
    ],
  }),
  maker.make({
    name: "map",
    output: "Array",
    requiresNamespace: false,
    examples: [
      "List.map([1,4,5], {|x| x+1})",
      "List.map([1,4,5], {|x,i| x+i+1})",
    ],
    definitions: [
      makeDefinition([frArray(frAny), frLambda], ([array, lambda], context) =>
        vArray(map(array, lambda, context))
      ),
    ],
  }),
  maker.make({
    name: "concat",
    requiresNamespace: true,
    examples: [`List.concat([1,2,3], [4, 5, 6])`],
    definitions: [
      makeDefinition([frArray(frAny), frArray(frAny)], ([array1, array2]) =>
        vArray([...array1].concat(array2))
      ),
    ],
  }),
  maker.make({
    name: "append",
    examples: [`List.append([1,4],5)`],
    definitions: [
      makeDefinition([frArray(frAny), frAny], ([array, el]) =>
        vArray([...array, el])
      ),
    ],
  }),
  maker.make({
    name: "uniq",
    requiresNamespace: true,
    examples: [`List.uniq([1,2,3,"hi",false,"hi"])`],
    definitions: [
      makeDefinition([frArray(frAny)], ([arr]) => vArray(uniq(arr))),
    ],
  }),
  maker.make({
    name: "uniqBy",
    requiresNamespace: true,
    examples: [`List.uniqBy([[1,5], [3,5], [5,7]], {|x| x[1]})`],
    definitions: [
      makeDefinition([frArray(frAny), frLambda], ([arr, lambda], context) => {
        _assert1ParamsLength(lambda, 1);
        return vArray(uniqBy(arr, (e) => lambda.call([e], context)));
      }),
    ],
  }),
  maker.make({
    name: "reduce",
    requiresNamespace: false,
    examples: [`List.reduce([1,4,5], 2, {|acc, el| acc+el})`],
    definitions: [
      makeDefinition(
        [frArray(frAny), frAny, frLambda],
        ([array, initialValue, lambda], context) =>
          reduce(array, initialValue, lambda, context)
      ),
    ],
  }),
  maker.make({
    name: "reduceReverse",
    requiresNamespace: false,
    examples: [`List.reduceReverse([1,4,5], 2, {|acc, el| acc-el})`],
    definitions: [
      makeDefinition(
        [frArray(frAny), frAny, frLambda],
        ([array, initialValue, lambda], context) =>
          reduceReverse(array, initialValue, lambda, context)
      ),
    ],
  }),
  maker.make({
    name: "reduceWhile",
    requiresNamespace: true,
    examples: [
      // Args: (list, initialValue, step, condition)
      // Returns the last value that fits the condition.
      // If even initial value doesn't fit the condition, it will be returned anyway;
      // So the result isn't guaranteed to fit the condition.
      `List.reduceWhile([1,4,5], 0, {|acc, curr| acc + curr }, {|acc| acc < 5})`,
    ],
    definitions: [
      makeDefinition(
        [frArray(frAny), frAny, frLambda, frLambda],
        ([array, initialValue, step, condition], context) =>
          reduceWhile(array, initialValue, step, condition, context)
      ),
    ],
  }),
  maker.make({
    name: "filter",
    requiresNamespace: false,
    examples: [`List.filter([1,4,5], {|x| x>3})`],
    definitions: [
      makeDefinition([frArray(frAny), frLambda], ([array, lambda], context) => {
        _assert1ParamsLength(lambda, 1);
        return vArray(array.filter(_binaryLambdaCheck1(lambda, context)));
      }),
    ],
  }),
  maker.make({
    name: "every",
    requiresNamespace: true,
    examples: [`List.every([1,4,5], {|el| el>3 })`],
    definitions: [
      makeDefinition([frArray(frAny), frLambda], ([array, lambda], context) => {
        _assert1ParamsLength(lambda, 1);
        return vBool(array.every(_binaryLambdaCheck1(lambda, context)));
      }),
    ],
  }),
  maker.make({
    name: "some",
    requiresNamespace: true,
    examples: [`List.some([1,4,5], {|el| el>3 })`],
    definitions: [
      makeDefinition([frArray(frAny), frLambda], ([array, lambda], context) => {
        _assert1ParamsLength(lambda, 1);
        return vBool(array.some(_binaryLambdaCheck1(lambda, context)));
      }),
    ],
  }),
  maker.make({
    name: "find",
    requiresNamespace: true,
    examples: [`List.find([1,4,5], {|el| el>3 })`],
    definitions: [
      makeDefinition([frArray(frAny), frLambda], ([array, lambda], context) => {
        _assert1ParamsLength(lambda, 1);
        const result = array.find(_binaryLambdaCheck1(lambda, context));
        if (!result) {
          throw new REOther("No element found");
        }
        return result;
      }),
    ],
  }),
  maker.make({
    name: "findIndex",
    requiresNamespace: true,
    examples: [`List.findIndex([1,4,5], {|el| el>3 })`],
    definitions: [
      makeDefinition([frArray(frAny), frLambda], ([array, lambda], context) => {
        _assert1ParamsLength(lambda, 1);
        return vNumber(array.findIndex(_binaryLambdaCheck1(lambda, context)));
      }),
    ],
  }),
  maker.make({
    name: "join",
    requiresNamespace: true,
    examples: [`List.join(["a", "b", "c"], ",")`],
    definitions: [
      makeDefinition([frArray(frString), frString], ([array, joinStr]) =>
        vString(array.join(joinStr))
      ),
      makeDefinition([frArray(frString)], ([array]) => vString(array.join())),
    ],
  }),
  maker.make({
    name: "flatten",
    requiresNamespace: true,
    examples: [`List.flatten([[1,2], [3,4]])`],
    definitions: [
      makeDefinition([frArray(frAny)], ([arr]) => vArray(arr).flatten()),
    ],
  }),
  maker.make({
    name: "shuffle",
    requiresNamespace: true,
    examples: [`List.shuffle([1,3,4,20])`],
    definitions: [
      makeDefinition([frArray(frAny)], ([arr]) => vArray(arr).shuffle()),
    ],
  }),
  maker.make({
    name: "zip",
    requiresNamespace: true,
    examples: [`List.zip([1,3,4,20], [2,4,5,6])`],
    definitions: [
      makeDefinition([frArray(frAny), frArray(frAny)], ([array1, array2]) => {
        if (array1.length !== array2.length) {
          throw new REOther("List lengths must be equal");
        }
        return vArray(zip(array1, array2).map((pair) => vArray(pair)));
      }),
    ],
  }),
  maker.make({
    name: "unzip",
    requiresNamespace: true,
    examples: [`List.unzip([[1,2], [2,3], [4,5]])`],
    definitions: [
      makeDefinition([frArray(frTuple2(frAny, frAny))], ([array]) => {
        return vArray(unzip(array as [Value, Value][]).map((r) => vArray(r)));
      }),
    ],
  }),
];
