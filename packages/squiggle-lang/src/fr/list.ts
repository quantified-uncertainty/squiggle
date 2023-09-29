import includes from "lodash/includes.js";
import uniqBy from "lodash/uniqBy.js";
import { REOther } from "../errors/messages.js";
import { makeDefinition } from "../library/registry/fnDefinition.js";
import {
  frAny,
  frDist,
  frArray,
  frLambda,
  frNumber,
  frString,
} from "../library/registry/frTypes.js";
import { FnFactory } from "../library/registry/helpers.js";
import * as E_A_Floats from "../utility/E_A_Floats.js";
import { Value, vArray, vNumber, vString, vBool } from "../value/index.js";
import { sampleSetAssert } from "./sampleset.js";
import { unzip, zip } from "../utility/E_A.js";
import { Lambda } from "../reducer/lambda.js";
import { ReducerContext } from "../reducer/context.js";

const maker = new FnFactory({
  nameSpace: "List",
  requiresNamespace: true,
});

const throwErrorIfInvalidArrayLength = (number: number) => {
  if (number < 0) {
    throw new REOther("Expected non-negative number");
  } else if (!Number.isInteger(number)) {
    throw new REOther("Number must be an integer");
  }
};

const isUniqableType = (t: Value) =>
  includes(["String", "Bool", "Number"], t.type);

const uniqueValueKey = (t: Value) => t.toString() + t.type;

function findHelper(findFunction: "find" | "findIndex") {
  return ([array, lambda]: [any[], any], context: any) => {
    const parameters = lambda.getParameterNames().length;
    if (parameters !== 1 && parameters !== 2) {
      throw new REOther("Expected function with 1 or 2 parameters");
    }
    const result = array[findFunction]((elem, index) => {
      const inputs = parameters === 1 ? [elem] : [elem, vNumber(index)];
      const result = lambda.call(inputs, context);
      return result.type === "Bool" && result.value;
    });
    if (result === undefined) {
      throw new REOther("No element found");
    } else {
      return findFunction === "find" ? result : vNumber(result);
    }
  };
}
function checkUniqable(
  arr: Value[],
  lambda?: Lambda,
  context?: ReducerContext
): void {
  let _arr = [...arr];
  if (lambda && context) {
    _arr = arr.map((e) => lambda.call([e], context));
  }
  const allUniqable = _arr.every(isUniqableType);
  if (!allUniqable) {
    throw new REOther("Can only apply uniq() to Strings, Numbers, or Bools");
  }
}

export const library = [
  maker.make({
    name: "length",
    output: "Number",
    examples: [`List.length([1,4,5])`],
    definitions: [
      makeDefinition([frArray(frAny)], ([values]) => vNumber(values.length)),
    ],
  }),
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
        throwErrorIfInvalidArrayLength(number);
        const parameterLength = lambda.getParameterNames().length;
        const runLambda = (fn: (i: number) => Value[]) => {
          return Array.from({ length: number }, (_, index) =>
            lambda.call(fn(index), context)
          );
        };
        if (parameterLength === 0) {
          return vArray(runLambda((_index) => []));
        } else if (parameterLength === 1) {
          return vArray(runLambda((index) => [vNumber(index)]));
        } else {
          throw new REOther("Expeced lambda with 0 or 1 parameters");
        }
      }),
      makeDefinition([frNumber, frAny], ([number, value]) => {
        throwErrorIfInvalidArrayLength(number);
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
      makeDefinition([frNumber, frNumber], ([low, high]) =>
        vArray(E_A_Floats.range(low, high, (high - low + 1) | 0).map(vNumber))
      ),
    ],
  }),
  maker.make({
    name: "first",
    examples: [`List.first([1,4,5])`],
    definitions: [
      makeDefinition([frArray(frAny)], ([array]) => {
        if (!array.length) {
          throw new REOther("No first element");
        } else {
          return array[0];
        }
      }),
    ],
  }),
  maker.make({
    name: "last",
    examples: [`List.last([1,4,5])`],
    definitions: [
      makeDefinition([frArray(frAny)], ([array]) => {
        if (!array.length) {
          throw new REOther("No last element");
        } else {
          return array[array.length - 1];
        }
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
      makeDefinition([frArray(frAny), frLambda], ([array, lambda], context) => {
        const mapped: Value[] = new Array(array.length);
        const parameters = lambda.getParameterNames().length;

        // this code is intentionally duplicated for performance reasons
        if (parameters === 1) {
          for (let i = 0; i < array.length; i++) {
            mapped[i] = lambda.call([array[i]], context);
          }
        } else if (parameters === 2) {
          for (let i = 0; i < array.length; i++) {
            mapped[i] = lambda.call([array[i], vNumber(i)], context);
          }
        } else {
          throw new REOther("Expected lambda with 1 or 2 parameters");
        }
        return vArray(mapped);
      }),
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
      makeDefinition([frArray(frAny), frAny], ([array, el]) => {
        const newArr = [...array, el];
        return vArray(newArr);
      }),
    ],
  }),
  maker.make({
    name: "uniq",
    requiresNamespace: true,
    examples: [`List.uniq([1,2,3,"hi",false,"hi"])`],
    definitions: [
      makeDefinition([frArray(frAny)], ([arr]) => {
        checkUniqable(arr);
        return vArray(uniqBy(arr, uniqueValueKey));
      }),
    ],
  }),
  maker.make({
    name: "uniqBy",
    requiresNamespace: true,
    examples: [`List.uniqBy([[1,5], [3,5], [5,7]], {|x| x[1]})`],
    definitions: [
      makeDefinition([frArray(frAny), frLambda], ([arr, lambda], context) => {
        checkUniqable(arr, lambda, context);
        return vArray(
          uniqBy(arr, (e: Value) => uniqueValueKey(lambda.call([e], context)))
        );
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
        ([array, initialValue, lambda], context) => {
          const parameters = lambda.getParameterNames().length;
          if (parameters === 2) {
            return array.reduce(
              (acc, elem) => lambda.call([acc, elem], context),
              initialValue
            );
          } else if (parameters === 3) {
            return array.reduce(
              (acc, elem, index) =>
                lambda.call([acc, elem, vNumber(index)], context),
              initialValue
            );
          } else {
            throw new REOther("Expected lambda with 2 or 3 parameters");
          }
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
        [frArray(frAny), frAny, frLambda],
        ([array, initialValue, lambda], context) =>
          [...array]
            .reverse()
            .reduce(
              (acc, elem) => lambda.call([acc, elem], context),
              initialValue
            )
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
        ([array, initialValue, step, condition], context) => {
          let acc = initialValue;
          for (let i = 0; i < array.length; i++) {
            const newAcc = step.call([acc, array[i]], context);

            const checkResult = condition.call([newAcc], context);
            if (checkResult.type !== "Bool") {
              throw new REOther(
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
      ),
    ],
  }),
  maker.make({
    name: "filter",
    requiresNamespace: false,
    examples: [`List.filter([1,4,5], {|x| x>3})`],
    definitions: [
      makeDefinition([frArray(frAny), frLambda], ([array, lambda], context) =>
        vArray(
          array.filter((elem) => {
            const result = lambda.call([elem], context);
            return result.type === "Bool" && result.value;
          })
        )
      ),
    ],
  }),
  maker.make({
    name: "every",
    requiresNamespace: false,
    examples: [`List.every([1,4,5], {|el| el>3 })`],
    definitions: [
      makeDefinition([frArray(frAny), frLambda], ([array, lambda], context) => {
        return vBool(
          array.every((elem) => {
            const result = lambda.call([elem], context);
            return result.type === "Bool" && result.value;
          })
        );
      }),
    ],
  }),
  maker.make({
    name: "some",
    requiresNamespace: false,
    examples: [`List.some([1,4,5], {|el| el>3 })`],
    definitions: [
      makeDefinition([frArray(frAny), frLambda], ([array, lambda], context) => {
        return vBool(
          array.some((elem) => {
            const result = lambda.call([elem], context);
            return result.type === "Bool" && result.value;
          })
        );
      }),
    ],
  }),
  maker.make({
    name: "find",
    requiresNamespace: false,
    examples: [`List.find([1,4,5], {|el| el>3 })`],
    definitions: [
      makeDefinition([frArray(frAny), frLambda], findHelper("find")),
    ],
  }),
  maker.make({
    name: "findIndex",
    requiresNamespace: false,
    examples: [`List.findIndex([1,4,5], {|el| el>3 })`],
    definitions: [
      makeDefinition([frArray(frAny), frLambda], findHelper("findIndex")),
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
      makeDefinition([frArray(frAny)], ([arr]) => {
        return vArray(arr).flatten();
      }),
    ],
  }),
  maker.make({
    name: "shuffle",
    requiresNamespace: true,
    examples: [`List.shuffle([1,3,4,20])`],
    definitions: [
      makeDefinition([frArray(frAny)], ([arr]) => {
        return vArray(arr).shuffle();
      }),
    ],
  }),
  maker.make({
    name: "zip",
    requiresNamespace: true,
    examples: [`List.zip([1,3,4,20], [2,4,5,6])`],
    definitions: [
      makeDefinition([frArray(frAny), frArray(frAny)], ([array1, array2]) => {
        if (array1.length !== array2.length) {
          throw new REOther("Array lengths must be equal");
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
      makeDefinition([frArray(frArray(frAny))], ([array]) => {
        if (!array.every((v) => v.length === 2)) {
          throw new REOther("Array must be an array of pairs");
        }
        return vArray(unzip(array as [Value, Value][]).map((r) => vArray(r)));
      }),
    ],
  }),
];
