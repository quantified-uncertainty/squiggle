import maxBy from "lodash/maxBy.js";
import minBy from "lodash/minBy.js";
import sortBy from "lodash/sortBy.js";

import { REArgumentError, REOther } from "../errors/messages.js";
import {
  makeDefinition,
  makeAssertDefinition,
} from "../library/registry/fnDefinition.js";
import {
  frAny,
  frArray,
  frBool,
  frGeneric,
  frLambdaNand,
  frLambdaTyped,
  frNamed,
  frNumber,
  frOptional,
  frSampleSetDist,
  frString,
  frTuple,
} from "../library/registry/frTypes.js";
import {
  FnFactory,
  chooseLambdaParamLength,
  doBinaryLambdaCall,
} from "../library/registry/helpers.js";
import { ReducerContext } from "../reducer/context.js";
import { Lambda } from "../reducer/lambda.js";
import { shuffle, unzip, zip } from "../utility/E_A.js";
import * as E_A_Floats from "../utility/E_A_Floats.js";
import { Value, uniq, uniqBy, vNumber } from "../value/index.js";

export function _map(
  array: readonly Value[],
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
  array: readonly Value[],
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
  array: readonly Value[],
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
const _assertUnemptyArray = (array: readonly Value[]) => {
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
      makeAssertDefinition(
        [frNumber, frLambdaNand([0, 1])],
        "Call with either 0 or 1 arguments, not both."
      ),
      makeDefinition(
        [
          frNumber,
          frLambdaTyped(
            [frNamed("index", frOptional(frNumber))],
            frGeneric("A")
          ),
        ],
        frArray(frGeneric("A")),
        ([num, lambda], context) => {
          _assertValidArrayLength(num);
          const usedOptional = chooseLambdaParamLength([0, 1], lambda) === 1;
          const fnCall = usedOptional
            ? (_: any, i: number) => lambda.call([vNumber(i)], context)
            : () => lambda.call([], context);
          return Array.from({ length: num }, fnCall);
        }
      ),
      makeDefinition(
        [frNumber, frGeneric("A")],
        frArray(frGeneric("A")),
        ([number, value]) => {
          _assertValidArrayLength(number);
          return new Array(number).fill(value);
        }
      ),
      makeDefinition([frSampleSetDist], frArray(frNumber), ([dist]) => {
        return dist.samples;
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
        return E_A_Floats.upTo(low, high);
      }),
    ],
  }),
  maker.make({
    name: "length",
    requiresNamespace: true,
    output: "Number",
    examples: [`List.length([1,4,5])`],
    definitions: [
      makeDefinition([frArray(frAny)], frNumber, ([values]) => values.length),
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
        ([array]) => [...array].reverse()
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
      makeAssertDefinition(
        [frNumber, frLambdaNand([1, 2])],
        "Call with either 1 or 2 arguments, not both."
      ),
      makeDefinition(
        [
          frArray(frGeneric("A")),
          frLambdaTyped(
            [frGeneric("A"), frNamed("index", frOptional(frNumber))],
            frGeneric("B")
          ),
        ],
        frArray(frGeneric("B")),
        ([array, lambda], context) => {
          const usedOptional = chooseLambdaParamLength([1, 2], lambda) === 2;
          return _map(array, lambda, context, usedOptional ? true : false);
        }
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
        ([array1, array2]) => [...array1].concat(array2)
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
          return sortBy(array, (e) =>
            applyLambdaAndCheckNumber(e, lambda, context)
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
        ([array, el]) => [...array, el]
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
        [
          frArray(frGeneric("A")),
          frNumber,
          frNamed("index", frOptional(frNumber)),
        ],
        frArray(frGeneric("A")),
        ([array, start, end]) => {
          _assertInteger(start);
          if (end !== null) {
            _assertInteger(end);
            return array.slice(start, end);
          } else {
            return array.slice(start);
          }
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
        ([arr]) => uniq(arr)
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
          uniqBy(arr, (e) => lambda.call([e], context))
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
      makeAssertDefinition(
        [frNumber, frLambdaNand([2, 3])],
        "Call with either 2 or 3 arguments, not both."
      ),
      makeDefinition(
        [
          frArray(frGeneric("B")),
          frGeneric("A"),
          frLambdaTyped(
            [
              frGeneric("A"),
              frGeneric("B"),
              frNamed("index", frOptional(frNumber)),
            ],
            frGeneric("A")
          ),
        ],
        frGeneric("A"),
        ([array, initialValue, lambda], context) => {
          const usedOptional = chooseLambdaParamLength([2, 3], lambda) === 3;
          return _reduce(
            array,
            initialValue,
            lambda,
            context,
            usedOptional ? true : false
          );
        }
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
          array.filter(_binaryLambdaCheck1(lambda, context))
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
          array.every(_binaryLambdaCheck1(lambda, context))
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
          array.some(_binaryLambdaCheck1(lambda, context))
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
          array.findIndex(_binaryLambdaCheck1(lambda, context))
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
        ([array, joinStr]) => array.join(joinStr)
      ),
      makeDefinition([frArray(frString)], frString, ([array]) => array.join()),
    ],
  }),
  maker.make({
    name: "flatten",
    requiresNamespace: true,
    examples: [`List.flatten([[1,2], [3,4]])`],
    definitions: [
      makeDefinition([frArray(frAny)], frArray(frAny), ([arr]) =>
        arr.reduce(
          (acc: Value[], v) =>
            acc.concat(v.type === "Array" ? v.value : ([v] as Value[])),
          []
        )
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
        ([arr]) => shuffle(arr)
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
          return zip(array1, array2);
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
        ([array]) => unzip(array)
      ),
    ],
  }),
];
