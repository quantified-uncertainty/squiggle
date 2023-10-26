import { REAmbiguous, REArgumentError, REOther } from "../errors/messages.js";
import { makeDefinition } from "../library/registry/fnDefinition.js";
import * as E_A_Floats from "../utility/E_A_Floats.js";
import {
  frAny,
  frDist,
  frLambdaN,
  frArray,
  frNumber,
  frString,
  frTuple,
  frLambdaNand,
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
import { Lambda } from "../reducer/lambda.js";
import { ReducerContext } from "../reducer/context.js";

export function _map(
  array: Value[],
  lambda: Lambda,
  context: ReducerContext,
  useIndex: boolean
): Value[] {
  const mapped: Value[] = new Array(array.length);
  // this code is intentionally duplicated for performance reasons
  if (!useIndex) {
    for (let i = 0; i < array.length; i++) {
      mapped[i] = lambda.call([array[i]], context);
    }
  } else {
    for (let i = 0; i < array.length; i++) {
      mapped[i] = lambda.call([array[i], vNumber(i)], context);
    }
  }

  return mapped;
}

export function _reduce(
  array: Value[],
  initialValue: Value,
  lambda: Lambda,
  context: ReducerContext,
  useIndex: boolean
): Value {
  if (!useIndex) {
    return array.reduce(
      (acc, elem) => lambda.call([acc, elem], context),
      initialValue
    );
  } else {
    return array.reduce(
      (acc, elem, index) => lambda.call([acc, elem, vNumber(index)], context),
      initialValue
    );
  }
}

export function _reduceWhile(
  array: Value[],
  initialValue: Value,
  step: Lambda,
  condition: Lambda,
  context: ReducerContext
): Value {
  let acc = initialValue;
  for (let i = 0; i < array.length; i++) {
    const newAcc = step.call([acc, array[i]], context);

    const checkResult = condition.call([newAcc], context);
    if (checkResult.type !== "Bool") {
      throw new REArgumentError(
        `Condition should return a boolean value, got: ${checkResult.type}`
      );
    }
    if (!checkResult.value) {
      // condition failed
      return acc;
    }
    acc = newAcc;
  }
  return acc;
}

const _assertInteger = (number: number) => {
  if (!Number.isInteger(number)) {
    throw new REArgumentError(`Number ${number} must be an integer`);
  }
};

const _assertValidArrayLength = (number: number) => {
  if (number < 0) {
    throw new REArgumentError("Expected non-negative number");
  } else if (!Number.isInteger(number)) {
    throw new REArgumentError("Number must be an integer");
  }
};
const _assertUnemptyArray = (array: Value[]) => {
  if (array.length === 0) {
    throw new REArgumentError("List must not be empty");
  }
};

function _binaryLambdaCheck1(
  lambda: Lambda,
  context: ReducerContext
): (e: Value) => boolean {
  return (el: Value) => doBinaryLambdaCall([el], lambda, context);
}

const maker = new FnFactory({
  nameSpace: "List",
  requiresNamespace: true,
});

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
      makeDefinition([frNumber, frLambdaNand([0, 1])], ([number, lambda]) => {
        throw new REAmbiguous("Call with either 0 or 1 arguments, not both");
      }),
      makeDefinition([frNumber, frLambdaN(0)], ([number, lambda], context) => {
        _assertValidArrayLength(number);
        return vArray(
          Array.from({ length: number }, (_) => lambda.call([], context))
        );
      }),
      makeDefinition([frNumber, frLambdaN(1)], ([number, lambda], context) => {
        _assertValidArrayLength(number);
        return vArray(
          Array.from({ length: number }, (_, i) =>
            lambda.call([vNumber(i)], context)
          )
        );
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
        if (!Number.isInteger(low) || !Number.isInteger(high)) {
          throw new REArgumentError(
            "Low and high values must both be integers"
          );
        }
        return vArray(E_A_Floats.upTo(low, high).map(vNumber));
      }),
    ],
  }),
  maker.make({
    name: "length",
    requiresNamespace: true,
    output: "Number",
    examples: [`List.length([1,4,5])`],
    definitions: [
      makeDefinition([frArray(frAny)], ([values]) => vNumber(values.length)),
    ],
  }),
  maker.make({
    name: "first",
    requiresNamespace: true,
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
    requiresNamespace: true,
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
      makeDefinition([frNumber, frLambdaNand([1, 2])], ([number, lambda]) => {
        throw new REAmbiguous("Call with either 1 or 2 arguments, not both.");
      }),
      makeDefinition(
        [frArray(frAny), frLambdaN(1)],
        ([array, lambda], context) =>
          vArray(_map(array, lambda, context, false))
      ),
      makeDefinition(
        [frArray(frAny), frLambdaN(2)],
        ([array, lambda], context) => vArray(_map(array, lambda, context, true))
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
    requiresNamespace: true,
    examples: [`List.append([1,4],5)`],
    definitions: [
      makeDefinition([frArray(frAny), frAny], ([array, el]) =>
        vArray([...array, el])
      ),
    ],
  }),
  maker.make({
    name: "slice",
    requiresNamespace: true,
    examples: [`List.slice([1,2,5,10],1,3)`],
    definitions: [
      makeDefinition([frArray(frAny), frNumber], ([array, start]) => {
        _assertInteger(start);
        return vArray(array.slice(start));
      }),
      makeDefinition(
        [frArray(frAny), frNumber, frNumber],
        ([array, start, end]) => {
          _assertInteger(start);
          _assertInteger(end);
          return vArray(array.slice(start, end));
        }
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
      makeDefinition([frArray(frAny), frLambdaN(1)], ([arr, lambda], context) =>
        vArray(uniqBy(arr, (e) => lambda.call([e], context)))
      ),
    ],
  }),
  maker.make({
    name: "reduce",
    requiresNamespace: false,
    examples: [`List.reduce([1,4,5], 2, {|acc, el| acc+el})`],
    definitions: [
      makeDefinition([frNumber, frLambdaNand([2, 3])], ([number, lambda]) => {
        throw new REAmbiguous("Call with either 2 or 3 arguments, not both");
      }),
      makeDefinition(
        [frArray(frAny), frAny, frLambdaN(2)],
        ([array, initialValue, lambda], context) =>
          _reduce(array, initialValue, lambda, context, false)
      ),
      makeDefinition(
        [frArray(frAny), frAny, frLambdaN(3)],
        ([array, initialValue, lambda], context) =>
          _reduce(array, initialValue, lambda, context, true)
      ),
    ],
  }),
  maker.make({
    name: "reduceReverse",
    requiresNamespace: false,
    examples: [`List.reduceReverse([1,4,5], 2, {|acc, el| acc-el})`],
    definitions: [
      makeDefinition(
        [frArray(frAny), frAny, frLambdaN(2)],
        ([array, initialValue, lambda], context) =>
          _reduce([...array].reverse(), initialValue, lambda, context, false)
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
        [frArray(frAny), frAny, frLambdaN(2), frLambdaN(1)],
        ([array, initialValue, step, condition], context) =>
          _reduceWhile(array, initialValue, step, condition, context)
      ),
    ],
  }),
  maker.make({
    name: "filter",
    requiresNamespace: false,
    examples: [`List.filter([1,4,5], {|x| x>3})`],
    definitions: [
      makeDefinition(
        [frArray(frAny), frLambdaN(1)],
        ([array, lambda], context) =>
          vArray(array.filter(_binaryLambdaCheck1(lambda, context)))
      ),
    ],
  }),
  maker.make({
    name: "every",
    requiresNamespace: true,
    examples: [`List.every([1,4,5], {|el| el>3 })`],
    definitions: [
      makeDefinition(
        [frArray(frAny), frLambdaN(1)],
        ([array, lambda], context) =>
          vBool(array.every(_binaryLambdaCheck1(lambda, context)))
      ),
    ],
  }),
  maker.make({
    name: "some",
    requiresNamespace: true,
    examples: [`List.some([1,4,5], {|el| el>3 })`],
    definitions: [
      makeDefinition(
        [frArray(frAny), frLambdaN(1)],
        ([array, lambda], context) =>
          vBool(array.some(_binaryLambdaCheck1(lambda, context)))
      ),
    ],
  }),
  maker.make({
    name: "find",
    requiresNamespace: true,
    examples: [`List.find([1,4,5], {|el| el>3 })`],
    definitions: [
      makeDefinition(
        [frArray(frAny), frLambdaN(1)],
        ([array, lambda], context) => {
          const result = array.find(_binaryLambdaCheck1(lambda, context));
          if (!result) {
            throw new REOther("No element found");
          }
          return result;
        }
      ),
    ],
  }),
  maker.make({
    name: "findIndex",
    requiresNamespace: true,
    examples: [`List.findIndex([1,4,5], {|el| el>3 })`],
    definitions: [
      makeDefinition(
        [frArray(frAny), frLambdaN(1)],
        ([array, lambda], context) =>
          vNumber(array.findIndex(_binaryLambdaCheck1(lambda, context)))
      ),
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
          throw new REArgumentError("List lengths must be equal");
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
      makeDefinition([frArray(frTuple(frAny, frAny))], ([array]) =>
        vArray(unzip(array as [Value, Value][]).map((r) => vArray(r)))
      ),
    ],
  }),
];
