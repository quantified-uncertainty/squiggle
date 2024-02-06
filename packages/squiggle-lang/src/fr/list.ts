import maxBy from "lodash/maxBy.js";
import minBy from "lodash/minBy.js";
import sortBy from "lodash/sortBy.js";

import { REArgumentError, REOther } from "../errors/messages.js";
import { makeFnExample } from "../library/registry/core.js";
import {
  makeAssertDefinition,
  makeDefinition,
} from "../library/registry/fnDefinition.js";
import {
  frAny,
  frArray,
  frBool,
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
  chooseLambdaParamLength,
  doBinaryLambdaCall,
  FnFactory,
} from "../library/registry/helpers.js";
import { Interpreter } from "../reducer/interpreter.js";
import { Lambda } from "../reducer/lambda.js";
import { shuffle, unzip, zip } from "../utility/E_A.js";
import * as E_A_Floats from "../utility/E_A_Floats.js";
import { uniq, uniqBy, Value } from "../value/index.js";
import { vNumber } from "../value/VNumber.js";

export function _map(
  array: readonly Value[],
  lambda: Lambda,
  context: Interpreter,
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
  context: Interpreter,
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
  context: Interpreter
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
  context: Interpreter
): (e: Value) => boolean {
  return (el: Value) => doBinaryLambdaCall([el], lambda, context);
}

function applyLambdaAndCheckNumber(
  element: Value,
  lambda: Lambda,
  context: Interpreter
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
      makeFnExample(`List.make(2, 3)`),
      makeFnExample(`List.make(2, {|| 3})`),
      makeFnExample(`List.make(2, {|index| index+1})`),
    ],
    displaySection: "Constructors",
    description: `Creates an array of length \`count\`, with each element being \`value\`. If \`value\` is a function, it will be called \`count\` times, with the index as the argument.`,
    definitions: [
      makeAssertDefinition(
        [frNumber, frLambdaNand([0, 1])],
        "Call with either 0 or 1 arguments, not both."
      ),
      makeDefinition(
        [
          frNamed("count", frNumber),
          frNamed(
            "fn",
            frLambdaTyped(
              [frNamed("index", frOptional(frNumber))],
              frAny({ genericName: "A" })
            )
          ),
        ],
        frArray(frAny({ genericName: "A" })),
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
        [
          frNamed("count", frNumber),
          frNamed("value", frAny({ genericName: "A" })),
        ],
        frArray(frAny({ genericName: "A" })),
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
    examples: [makeFnExample(`List.upTo(1,4)`)],
    displaySection: "Constructors",
    definitions: [
      makeDefinition(
        [frNamed("low", frNumber), frNamed("high", frNumber)],
        frArray(frNumber),
        ([low, high]) => {
          if (!Number.isInteger(low) || !Number.isInteger(high)) {
            throw new REArgumentError(
              "Low and high values must both be integers"
            );
          }
          return E_A_Floats.upTo(low, high);
        }
      ),
    ],
  }),
  maker.make({
    name: "length",
    requiresNamespace: true,
    output: "Number",
    examples: [makeFnExample(`List.length([1,4,5])`)],
    displaySection: "Queries",
    definitions: [
      makeDefinition([frArray(frAny())], frNumber, ([values]) => values.length),
    ],
  }),
  maker.make({
    name: "first",
    requiresNamespace: true,
    examples: [makeFnExample(`List.first([1,4,5])`)],
    displaySection: "Queries",
    definitions: [
      makeDefinition(
        [frArray(frAny({ genericName: "A" }))],
        frAny({ genericName: "A" }),
        ([array]) => {
          _assertUnemptyArray(array);
          return array[0];
        }
      ),
    ],
  }),
  maker.make({
    name: "last",
    requiresNamespace: true,
    examples: [makeFnExample(`List.last([1,4,5])`)],
    displaySection: "Queries",
    definitions: [
      makeDefinition(
        [frArray(frAny({ genericName: "A" }))],
        frAny({ genericName: "A" }),
        ([array]) => {
          _assertUnemptyArray(array);
          return array[array.length - 1];
        }
      ),
    ],
  }),
  maker.make({
    name: "reverse",
    output: "Array",
    requiresNamespace: false,
    examples: [makeFnExample(`List.reverse([1,4,5]) // [5,4,1]`)],
    displaySection: "Modifications",
    definitions: [
      makeDefinition(
        [frArray(frAny({ genericName: "A" }))],
        frArray(frAny({ genericName: "A" })),
        ([array]) => [...array].reverse()
      ),
    ],
  }),

  maker.make({
    name: "concat",
    requiresNamespace: false,
    examples: [makeFnExample(`List.concat([1,2,3], [4, 5, 6])`)],
    displaySection: "Modifications",
    definitions: [
      makeDefinition(
        [
          frArray(frAny({ genericName: "A" })),
          frArray(frAny({ genericName: "A" })),
        ],
        frArray(frAny({ genericName: "A" })),
        ([array1, array2]) => [...array1].concat(array2)
      ),
    ],
  }),
  maker.make({
    name: "sortBy",
    requiresNamespace: true,
    examples: [makeFnExample(`List.sortBy([{a:3}, {a:1}], {|f| f.a})`)],
    displaySection: "Modifications",
    definitions: [
      makeDefinition(
        [
          frArray(frAny({ genericName: "A" })),
          frNamed("fn", frLambdaTyped([frAny({ genericName: "A" })], frNumber)),
        ],
        frArray(frAny({ genericName: "A" })),
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
    examples: [makeFnExample(`List.minBy([{a:3}, {a:1}], {|f| f.a})`)],
    displaySection: "Queries",
    definitions: [
      makeDefinition(
        [
          frArray(frAny({ genericName: "A" })),
          frNamed("fn", frLambdaTyped([frAny({ genericName: "A" })], frNumber)),
        ],
        frAny({ genericName: "A" }),
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
    examples: [makeFnExample(`List.maxBy([{a:3}, {a:1}], {|f| f.a})`)],
    displaySection: "Queries",
    definitions: [
      makeDefinition(
        [
          frArray(frAny({ genericName: "A" })),
          frNamed("fn", frLambdaTyped([frAny({ genericName: "A" })], frNumber)),
        ],
        frAny({ genericName: "A" }),
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
    examples: [makeFnExample(`List.append([1,4],5)`)],
    displaySection: "Modifications",
    definitions: [
      makeDefinition(
        [frArray(frAny({ genericName: "A" })), frAny({ genericName: "A" })],
        frArray(frAny({ genericName: "A" })),
        ([array, el]) => [...array, el]
      ),
    ],
  }),
  maker.make({
    name: "slice",
    description:
      "Returns a copy of the list, between the selected ``start`` and ``end``, end not included. Directly uses the [Javascript implementation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice) underneath.",
    requiresNamespace: true,
    examples: [makeFnExample(`List.slice([1,2,5,10],1,3)`)],
    displaySection: "Filtering",
    definitions: [
      makeDefinition(
        [
          frArray(frAny({ genericName: "A" })),
          frNamed("startIndex", frNumber),
          frNamed("endIndex", frOptional(frNumber)),
        ],
        frArray(frAny({ genericName: "A" })),
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
    examples: [makeFnExample(`List.uniq([1,2,3,"hi",false,"hi"])`)],
    displaySection: "Filtering",
    definitions: [
      makeDefinition(
        [frArray(frAny({ genericName: "A" }))],
        frArray(frAny({ genericName: "A" })),
        ([arr]) => uniq(arr)
      ),
    ],
  }),
  maker.make({
    name: "uniqBy",
    description:
      "Filters the list for unique elements. Works on select Squiggle types.",
    requiresNamespace: true,
    examples: [makeFnExample(`List.uniqBy([[1,5], [3,5], [5,7]], {|x| x[1]})`)],
    displaySection: "Filtering",
    definitions: [
      makeDefinition(
        [
          frArray(frAny({ genericName: "A" })),
          frLambdaTyped(
            [frAny({ genericName: "A" })],
            frAny({ genericName: "B" })
          ),
        ],
        frArray(frAny({ genericName: "A" })),
        ([arr, lambda], context) =>
          uniqBy(arr, (e) => lambda.call([e], context))
      ),
    ],
  }),
  maker.make({
    name: "map",
    output: "Array",
    requiresNamespace: false,
    displaySection: "Functional Transformations",
    examples: [
      makeFnExample("List.map([1,4,5], {|x| x+1})"),
      makeFnExample("List.map([1,4,5], {|x,i| x+i+1})"),
    ],
    definitions: [
      makeAssertDefinition(
        [frNumber, frLambdaNand([1, 2])],
        "Call with either 1 or 2 arguments, not both."
      ),
      makeDefinition(
        [
          frArray(frAny({ genericName: "A" })),
          frLambdaTyped(
            [
              frAny({ genericName: "A" }),
              frNamed("index", frOptional(frNumber)),
            ],
            frAny({ genericName: "B" })
          ),
        ],
        frArray(frAny({ genericName: "B" })),
        ([array, lambda], context) => {
          const usedOptional = chooseLambdaParamLength([1, 2], lambda) === 2;
          return _map(array, lambda, context, usedOptional ? true : false);
        }
      ),
    ],
  }),
  maker.make({
    name: "reduce",
    requiresNamespace: false,
    displaySection: "Functional Transformations",
    description:
      "Applies `f` to each element of `arr`. The function `f` has two main paramaters, an accumulator and the next value from the array. It can also accept an optional third `index` parameter.",
    examples: [makeFnExample(`List.reduce([1,4,5], 2, {|acc, el| acc+el})`)],
    definitions: [
      makeAssertDefinition(
        [frNumber, frNamed("fn", frLambdaNand([2, 3]))],
        "Call with either 2 or 3 arguments, not both."
      ),
      makeDefinition(
        [
          frArray(frAny({ genericName: "B" })),
          frNamed("initialValue", frAny({ genericName: "A" })),
          frNamed(
            "callbackFn",
            frLambdaTyped(
              [
                frNamed("accumulator", frAny({ genericName: "A" })),
                frNamed("currentValue", frAny({ genericName: "B" })),
                frNamed("currentIndex", frOptional(frNumber)),
              ],
              frAny({ genericName: "A" })
            )
          ),
        ],
        frAny({ genericName: "A" }),
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
    displaySection: "Functional Transformations",
    examples: [
      makeFnExample(`List.reduceReverse([1,4,5], 2, {|acc, el| acc-el})`),
    ],
    description: `Works like \`reduce\`, but the function is applied to each item from the last back to the first.`,
    definitions: [
      makeDefinition(
        [
          frArray(frAny({ genericName: "B" })),
          frNamed("initialValue", frAny({ genericName: "A" })),
          frNamed(
            "callbackFn",
            frLambdaTyped(
              [
                frNamed("accumulator", frAny({ genericName: "A" })),
                frNamed("currentValue", frAny({ genericName: "B" })),
              ],
              frAny({ genericName: "A" })
            )
          ),
        ],
        frAny({ genericName: "A" }),
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
      makeFnExample(`// Adds first two elements, returns \`11\`.
List.reduceWhile([5, 6, 7], 0, {|acc, curr| acc + curr}, {|acc| acc < 15})
`),
      makeFnExample(`// Adds first two elements, returns \`{ x: 11 }\`.
List.reduceWhile(
  [5, 6, 7],
  { x: 0 },
  {|acc, curr| { x: acc.x + curr }},
  {|acc| acc.x < 15}
)
`),
    ],
    description: `Works like \`reduce\`, but stops when the condition is no longer met. This is useful, in part, for simulating processes that need to stop based on the process state.
    `,
    displaySection: "Functional Transformations",
    definitions: [
      makeDefinition(
        [
          frArray(frAny({ genericName: "B" })),
          frNamed("initialValue", frAny({ genericName: "A" })),
          frNamed(
            "callbackFn",
            frLambdaTyped(
              [
                frNamed("accumulator", frAny({ genericName: "A" })),
                frNamed("currentValue", frAny({ genericName: "B" })),
              ],
              frAny({ genericName: "A" })
            )
          ),
          frNamed(
            "conditionFn",
            frLambdaTyped([frAny({ genericName: "A" })], frBool)
          ),
        ],
        frAny({ genericName: "A" }),
        ([array, initialValue, step, condition], context) =>
          _reduceWhile(array, initialValue, step, condition, context)
      ),
    ],
  }),
  maker.make({
    name: "filter",
    requiresNamespace: false,
    examples: [makeFnExample(`List.filter([1,4,5], {|x| x>3})`)],
    displaySection: "Filtering",
    definitions: [
      makeDefinition(
        [
          frArray(frAny({ genericName: "A" })),
          frNamed("fn", frLambdaTyped([frAny({ genericName: "A" })], frBool)),
        ],
        frArray(frAny({ genericName: "A" })),
        ([array, lambda], context) =>
          array.filter(_binaryLambdaCheck1(lambda, context))
      ),
    ],
  }),
  maker.make({
    name: "every",
    requiresNamespace: true,
    examples: [makeFnExample(`List.every([1,4,5], {|el| el>3 })`)],
    displaySection: "Queries",
    definitions: [
      makeDefinition(
        [
          frArray(frAny({ genericName: "A" })),
          frNamed("fn", frLambdaTyped([frAny({ genericName: "A" })], frBool)),
        ],
        frBool,
        ([array, lambda], context) =>
          array.every(_binaryLambdaCheck1(lambda, context))
      ),
    ],
  }),
  maker.make({
    name: "some",
    requiresNamespace: true,
    examples: [makeFnExample(`List.some([1,4,5], {|el| el>3 })`)],
    displaySection: "Queries",
    definitions: [
      makeDefinition(
        [
          frArray(frAny({ genericName: "A" })),
          frNamed("fn", frLambdaTyped([frAny({ genericName: "A" })], frBool)),
        ],
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
    examples: [makeFnExample(`List.find([1,4,5], {|el| el>3 })`)],
    displaySection: "Queries",
    definitions: [
      makeDefinition(
        [
          frArray(frAny({ genericName: "A" })),
          frNamed("fn", frLambdaTyped([frAny({ genericName: "A" })], frBool)),
        ],
        frAny({ genericName: "A" }),
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
    examples: [makeFnExample(`List.findIndex([1,4,5], {|el| el>3 })`)],
    displaySection: "Queries",
    definitions: [
      makeDefinition(
        [
          frArray(frAny({ genericName: "A" })),
          frNamed("fn", frLambdaTyped([frAny({ genericName: "A" })], frBool)),
        ],
        frNumber,
        ([array, lambda], context) =>
          array.findIndex(_binaryLambdaCheck1(lambda, context))
      ),
    ],
  }),
  maker.make({
    name: "join",
    requiresNamespace: true,
    examples: [makeFnExample(`List.join(["a", "b", "c"], ",") // "a,b,c"`)],
    displaySection: "Modifications",
    definitions: [
      makeDefinition(
        [frArray(frString), frNamed("separator", frOptional(frString))],
        frString,
        ([array, joinStr]) => array.join(joinStr ?? ",")
      ),
      makeDefinition([frArray(frString)], frString, ([array]) => array.join()),
    ],
  }),
  maker.make({
    name: "flatten",
    requiresNamespace: true,
    examples: [makeFnExample(`List.flatten([[1,2], [3,4]])`)],
    displaySection: "Modifications",
    definitions: [
      makeDefinition([frArray(frAny())], frArray(frAny()), ([arr]) =>
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
    examples: [makeFnExample(`List.shuffle([1,3,4,20])`)],
    displaySection: "Modifications",
    definitions: [
      makeDefinition(
        [frArray(frAny({ genericName: "A" }))],
        frArray(frAny({ genericName: "A" })),
        ([arr], context) => shuffle(arr, context.rng)
      ),
    ],
  }),
  maker.make({
    name: "zip",
    requiresNamespace: true,
    examples: [makeFnExample(`List.zip([1,3,4,20], [2,4,5,6])`)],
    displaySection: "Modifications",
    definitions: [
      makeDefinition(
        [
          frArray(frAny({ genericName: "A" })),
          frArray(frAny({ genericName: "B" })),
        ],
        frArray(
          frTuple(frAny({ genericName: "A" }), frAny({ genericName: "B" }))
        ),
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
    examples: [makeFnExample(`List.unzip([[1,2], [2,3], [4,5]])`)],
    displaySection: "Modifications",
    definitions: [
      makeDefinition(
        [
          frArray(
            frTuple(frAny({ genericName: "A" }), frAny({ genericName: "B" }))
          ),
        ],
        frTuple(
          frArray(frAny({ genericName: "A" })),
          frArray(frAny({ genericName: "B" }))
        ),
        ([array]) => unzip(array)
      ),
    ],
  }),
];
