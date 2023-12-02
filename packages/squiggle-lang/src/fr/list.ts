import { REAmbiguous, REArgumentError, REOther } from "../errors/messages.js";
import { makeDefinition } from "../library/registry/fnDefinition.js";
import * as E_A_Floats from "../utility/E_A_Floats.js";
import {
  frAny,
  frArray,
  frNumber,
  frString,
  frTuple,
  frLambdaNand,
  frLambdaTyped,
  frGeneric,
  frBool,
  frSampleSet,
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
import { unzip, zip } from "../utility/E_A.js";
import { Lambda } from "../reducer/lambda.js";
import { ReducerContext } from "../reducer/context.js";
import sortBy from "lodash/sortBy.js";
import minBy from "lodash/minBy.js";
import maxBy from "lodash/maxBy.js";

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

function applyLambdaAndCheckNumber(
  element: Value,
  lambda: Lambda,
  context: ReducerContext
): number {
  const item = lambda.call([element], context);
  if (item.type !== "Number") {
    throw new REArgumentError("Function must return a number");
  }
  return item.value;
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
      makeDefinition([frNumber, frLambdaNand([0, 1])], frAny, (_) => {
        throw new REAmbiguous("Call with either 0 or 1 arguments, not both");
      }),
      makeDefinition(
        [frNumber, frLambdaTyped([], frGeneric("A"))],
        frArray(frGeneric("A")),
        ([number, lambda], context) => {
          _assertValidArrayLength(number);
          return vArray(
            Array.from({ length: number }, (_) => lambda.call([], context))
          );
        }
      ),
      makeDefinition(
        [frNumber, frLambdaTyped([frNumber], frGeneric("A"))],
        frArray(frGeneric("A")),
        ([number, lambda], context) => {
          _assertValidArrayLength(number);
          return vArray(
            Array.from({ length: number }, (_, i) =>
              lambda.call([vNumber(i)], context)
            )
          );
        }
      ),
      makeDefinition(
        [frNumber, frGeneric("A")],
        frArray(frGeneric("A")),
        ([number, value]) => {
          _assertValidArrayLength(number);
          return vArray(new Array(number).fill(value));
        }
      ),
      makeDefinition([frSampleSet], frArray(frNumber), ([dist]) => {
        return vArray(dist.samples.map(vNumber));
      }),
    ],
  }),
  maker.make({
    name: "upTo",
    output: "Array",
    examples: [`List.upTo(1,4)`],
    definitions: [
      makeDefinition([frNumber, frNumber], frArray(frNumber), ([low, high]) => {
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
      makeDefinition([frArray(frAny)], frNumber, ([values]) =>
        vNumber(values.length)
      ),
    ],
  }),
  maker.make({
    name: "first",
    requiresNamespace: true,
    examples: [`List.first([1,4,5])`],
    definitions: [
      makeDefinition([frArray(frGeneric("A"))], frGeneric("A"), ([array]) => {
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
      makeDefinition([frArray(frGeneric("A"))], frGeneric("A"), ([array]) => {
        _assertUnemptyArray(array);
        return array[array.length - 1];
      }),
    ],
  }),
  maker.make({
    name: "reverse",
    output: "Array",
    requiresNamespace: false,
    examples: [`List.reverse([1,4,5]) // [5,4,1]`],
    definitions: [
      makeDefinition(
        [frArray(frGeneric("A"))],
        frArray(frGeneric("A")),
        ([array]) => vArray([...array].reverse())
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
      makeDefinition(
        [frNumber, frLambdaNand([1, 2])],
        frAny,
        ([number, lambda]) => {
          throw new REAmbiguous("Call with either 1 or 2 arguments, not both.");
        }
      ),
      makeDefinition(
        [
          frArray(frGeneric("A")),
          frLambdaTyped([frGeneric("A")], frGeneric("B")),
        ],
        frArray(frGeneric("B")),
        ([array, lambda], context) =>
          vArray(_map(array, lambda, context, false))
      ),
      makeDefinition(
        [
          frArray(frGeneric("A")),
          frLambdaTyped([frGeneric("A"), frNumber], frGeneric("B")),
        ],
        frArray(frGeneric("B")),
        ([array, lambda], context) => vArray(_map(array, lambda, context, true))
      ),
    ],
  }),
  maker.make({
    name: "concat",
    requiresNamespace: true,
    examples: [`List.concat([1,2,3], [4, 5, 6])`],
    definitions: [
      makeDefinition(
        [frArray(frGeneric("A")), frArray(frGeneric("A"))],
        frArray(frGeneric("A")),
        ([array1, array2]) => vArray([...array1].concat(array2))
      ),
    ],
  }),
  maker.make({
    name: "sortBy",
    requiresNamespace: true,
    examples: [`List.sortBy([{a:3}, {a:1}], {|f| f.a})`],
    definitions: [
      makeDefinition(
        [frArray(frGeneric("A")), frLambdaTyped([frGeneric("A")], frNumber)],
        frArray(frGeneric("A")),
        ([array, lambda], context) => {
          return vArray(
            sortBy(array, (e) => applyLambdaAndCheckNumber(e, lambda, context))
          );
        }
      ),
    ],
  }),
  maker.make({
    name: "minBy",
    requiresNamespace: true,
    examples: [`List.minBy([{a:3}, {a:1}], {|f| f.a})`],
    definitions: [
      makeDefinition(
        [frArray(frGeneric("A")), frLambdaTyped([frGeneric("A")], frNumber)],
        frGeneric("A"),
        ([array, lambda], context) => {
          _assertUnemptyArray(array);
          const el = minBy(array, (e) =>
            applyLambdaAndCheckNumber(e, lambda, context)
          );
          if (!el) {
            //This should never be reached, because we checked that the array is not empty
            throw new REOther("No element found");
          }
          return el;
        }
      ),
    ],
  }),
  maker.make({
    name: "maxBy",
    requiresNamespace: true,
    examples: [`List.maxBy([{a:3}, {a:1}], {|f| f.a})`],
    definitions: [
      makeDefinition(
        [frArray(frGeneric("A")), frLambdaTyped([frGeneric("A")], frNumber)],
        frGeneric("A"),
        ([array, lambda], context) => {
          _assertUnemptyArray(array);
          const el = maxBy(array, (e) =>
            applyLambdaAndCheckNumber(e, lambda, context)
          );
          if (!el) {
            //This should never be reached, because we checked that the array is not empty
            throw new REOther("No element found");
          }
          return el;
        }
      ),
    ],
  }),
  maker.make({
    name: "append",
    requiresNamespace: true,
    examples: [`List.append([1,4],5)`],
    definitions: [
      makeDefinition(
        [frArray(frGeneric("A")), frGeneric("A")],
        frArray(frGeneric("A")),
        ([array, el]) => vArray([...array, el])
      ),
    ],
  }),
  maker.make({
    name: "slice",
    description:
      "Returns a copy of the list, between the selected ``start`` and ``end``, end not included. Directly uses the [Javascript implementation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice) underneath.",
    requiresNamespace: true,
    examples: [`List.slice([1,2,5,10],1,3)`],
    definitions: [
      makeDefinition(
        [frArray(frGeneric("A")), frNumber],
        frArray(frGeneric("A")),
        ([array, start]) => {
          _assertInteger(start);
          return vArray(array.slice(start));
        }
      ),
      makeDefinition(
        [frArray(frGeneric("A")), frNumber, frNumber],
        frArray(frGeneric("A")),
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
    description:
      "Filters the list for unique elements. Works on select Squiggle types.",
    requiresNamespace: true,
    examples: [`List.uniq([1,2,3,"hi",false,"hi"])`],
    definitions: [
      makeDefinition(
        [frArray(frGeneric("A"))],
        frArray(frGeneric("A")),
        ([arr]) => vArray(uniq(arr))
      ),
    ],
  }),
  maker.make({
    name: "uniqBy",
    description:
      "Filters the list for unique elements. Works on select Squiggle types.",
    requiresNamespace: true,
    examples: [`List.uniqBy([[1,5], [3,5], [5,7]], {|x| x[1]})`],
    definitions: [
      makeDefinition(
        [
          frArray(frGeneric("A")),
          frLambdaTyped([frGeneric("A")], frGeneric("B")),
        ],
        frArray(frGeneric("A")),
        ([arr, lambda], context) =>
          vArray(uniqBy(arr, (e) => lambda.call([e], context)))
      ),
    ],
  }),
  maker.make({
    name: "reduce",
    requiresNamespace: false,
    description:
      "Applies `f` to each element of `arr`. The function `f` has two main paramaters, an accumulator and the next value from the array. It can also accept an optional third `index` parameter.",
    examples: [`List.reduce([1,4,5], 2, {|acc, el| acc+el})`],
    definitions: [
      makeDefinition(
        [frNumber, frLambdaNand([2, 3])],
        frAny,
        ([number, lambda]) => {
          throw new REAmbiguous("Call with either 2 or 3 arguments, not both");
        }
      ),
      makeDefinition(
        [
          frArray(frGeneric("B")),
          frGeneric("A"),
          frLambdaTyped([frGeneric("A"), frGeneric("B")], frGeneric("A")),
        ],
        frGeneric("A"),
        ([array, initialValue, lambda], context) =>
          _reduce(array, initialValue, lambda, context, false)
      ),
      makeDefinition(
        [
          frArray(frGeneric("B")),
          frGeneric("A"),
          frLambdaTyped(
            [frGeneric("A"), frGeneric("B"), frNumber],
            frGeneric("A")
          ),
        ],
        frGeneric("A"),
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
        [
          frArray(frGeneric("B")),
          frGeneric("A"),
          frLambdaTyped([frGeneric("A"), frGeneric("B")], frGeneric("A")),
        ],
        frGeneric("A"),
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
        [
          frArray(frGeneric("B")),
          frGeneric("A"),
          frLambdaTyped([frGeneric("A"), frGeneric("B")], frGeneric("A")),
          frLambdaTyped([frGeneric("A")], frBool),
        ],
        frGeneric("A"),
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
        [frArray(frGeneric("A")), frLambdaTyped([frGeneric("A")], frBool)],
        frArray(frGeneric("A")),
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
        [frArray(frGeneric("A")), frLambdaTyped([frGeneric("A")], frBool)],
        frBool,
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
        [frArray(frGeneric("A")), frLambdaTyped([frGeneric("A")], frBool)],
        frBool,
        ([array, lambda], context) =>
          vBool(array.some(_binaryLambdaCheck1(lambda, context)))
      ),
    ],
  }),
  maker.make({
    name: "find",
    description: "Returns an error if there is no value found",
    requiresNamespace: true,
    examples: [`List.find([1,4,5], {|el| el>3 })`],
    definitions: [
      makeDefinition(
        [frArray(frGeneric("A")), frLambdaTyped([frGeneric("A")], frBool)],
        frGeneric("A"),
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
    description: "Returns `-1` if there is no value found",
    requiresNamespace: true,
    examples: [`List.findIndex([1,4,5], {|el| el>3 })`],
    definitions: [
      makeDefinition(
        [frArray(frGeneric("A")), frLambdaTyped([frGeneric("A")], frBool)],
        frNumber,
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
      makeDefinition(
        [frArray(frString), frString],
        frString,
        ([array, joinStr]) => vString(array.join(joinStr))
      ),
      makeDefinition([frArray(frString)], frString, ([array]) =>
        vString(array.join())
      ),
    ],
  }),
  maker.make({
    name: "flatten",
    requiresNamespace: true,
    examples: [`List.flatten([[1,2], [3,4]])`],
    definitions: [
      makeDefinition([frArray(frAny)], frArray(frAny), ([arr]) =>
        vArray(arr).flatten()
      ),
    ],
  }),
  maker.make({
    name: "shuffle",
    requiresNamespace: true,
    examples: [`List.shuffle([1,3,4,20])`],
    definitions: [
      makeDefinition(
        [frArray(frGeneric("A"))],
        frArray(frGeneric("A")),
        ([arr]) => vArray(arr).shuffle()
      ),
    ],
  }),
  maker.make({
    name: "zip",
    requiresNamespace: true,
    examples: [`List.zip([1,3,4,20], [2,4,5,6])`],
    definitions: [
      makeDefinition(
        [frArray(frGeneric("A")), frArray(frGeneric("B"))],
        frArray(frTuple(frGeneric("A"), frGeneric("B"))),
        ([array1, array2]) => {
          if (array1.length !== array2.length) {
            throw new REArgumentError("List lengths must be equal");
          }
          return vArray(zip(array1, array2).map((pair) => vArray(pair)));
        }
      ),
    ],
  }),
  maker.make({
    name: "unzip",
    requiresNamespace: true,
    examples: [`List.unzip([[1,2], [2,3], [4,5]])`],
    definitions: [
      makeDefinition(
        [frArray(frTuple(frGeneric("A"), frGeneric("B")))],
        frTuple(frArray(frGeneric("A")), frArray(frGeneric("B"))),
        ([array]) =>
          vArray(unzip(array as [Value, Value][]).map((r) => vArray(r)))
      ),
    ],
  }),
];
