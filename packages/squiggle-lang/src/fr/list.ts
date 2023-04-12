import { makeDefinition } from "../library/registry/fnDefinition.js";
import {
  frAny,
  frArray,
  frLambda,
  frNumber,
  frString,
} from "../library/registry/frTypes.js";
import { FnFactory } from "../library/registry/helpers.js";
import { Ok } from "../utility/result.js";
import * as Result from "../utility/result.js";
import { Value, vArray, vNumber, vString } from "../value/index.js";
import * as E_A_Floats from "../utility/E_A_Floats.js";
import { REOther } from "../reducer/ErrorMessage.js";
import includes from "lodash/includes.js";
import uniqBy from "lodash/uniqBy.js";

const maker = new FnFactory({
  nameSpace: "List",
  requiresNamespace: true,
});

export const library = [
  maker.make({
    name: "length",
    output: "Number",
    examples: [`List.length([1,4,5])`],
    definitions: [
      makeDefinition("length", [frArray(frAny)], ([values]) =>
        Ok(vNumber(values.length))
      ),
    ],
  }),
  maker.make({
    name: "make",
    output: "Array",
    examples: [`List.make(2, "testValue")`],
    definitions: [
      // TODO: If the second item is a function with no args, it could be nice to run this function and return the result.
      // TODO: check if number is int, and fail instead of silently rounding?
      makeDefinition("make", [frNumber, frAny], ([number, value]) =>
        Ok(vArray(new Array(number | 0).fill(value)))
      ),
    ],
  }),
  maker.make({
    name: "upTo",
    output: "Array",
    examples: [`List.upTo(1,4)`],
    definitions: [
      makeDefinition("upTo", [frNumber, frNumber], ([low, high]) =>
        Ok(
          vArray(E_A_Floats.range(low, high, (high - low + 1) | 0).map(vNumber))
        )
      ),
    ],
  }),
  maker.make({
    name: "first",
    examples: [`List.first([1,4,5])`],
    definitions: [
      makeDefinition("first", [frArray(frAny)], ([array]) => {
        if (!array.length) {
          return Result.Error(REOther("No first element"));
        } else {
          return Ok(array[0]);
        }
      }),
    ],
  }),
  maker.make({
    name: "last",
    examples: [`List.last([1,4,5])`],
    definitions: [
      makeDefinition("last", [frArray(frAny)], ([array]) => {
        if (!array.length) {
          return Result.Error(REOther("No last element"));
        } else {
          return Ok(array[array.length - 1]);
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
      makeDefinition("reverse", [frArray(frAny)], ([array]) =>
        Ok(vArray([...array].reverse()))
      ),
    ],
  }),
  maker.make({
    name: "map",
    output: "Array",
    requiresNamespace: false,
    examples: [`List.map([1,4,5], {|x| x+1})`],
    definitions: [
      makeDefinition(
        "map",
        [frArray(frAny), frLambda],
        ([array, lambda], context, reducer) => {
          const mapped: Value[] = new Array(array.length);
          for (let i = 0; i < array.length; i++) {
            mapped[i] = lambda.call([array[i]], context, reducer);
          }
          return Ok(vArray(mapped));
        }
      ),
    ],
  }),
  maker.make({
    name: "concat",
    requiresNamespace: true,
    examples: [`List.concat([1,2,3], [4, 5, 6])`],
    definitions: [
      makeDefinition<Value[], Value[]>(
        "concat",
        [frArray(frAny), frArray(frAny)],
        ([array1, array2]) => Ok(vArray([...array1].concat(array2)))
      ),
    ],
  }),
  maker.make({
    name: "append",
    examples: [`List.append([1,4],5)`],
    definitions: [
      makeDefinition("append", [frArray(frAny), frAny], ([array, el]) => {
        let newArr = [...array, el];
        return Ok(vArray(newArr));
      }),
    ],
  }),
  maker.make({
    name: "uniq",
    requiresNamespace: true,
    examples: [`List.uniq([1,2,3,"hi",false,"hi"])`],
    definitions: [
      makeDefinition<Value[]>("uniq", [frArray(frAny)], ([arr]) => {
        const isUniqableType = (t: Value) =>
          includes(["String", "Bool", "Number"], t.type);
        //I'm not sure if the r.type concat is essential, but seems safe.
        const uniqueValueKey = (t: Value) => t.toString() + t.type;

        const allUniqable = arr.every(isUniqableType);
        if (allUniqable) {
          return Ok(vArray(uniqBy(arr, uniqueValueKey)));
        } else {
          return Result.Error(
            REOther("Can only apply uniq() to Strings, Numbers, or Bools")
          );
        }
      }),
    ],
  }),
  maker.make({
    name: "reduce",
    requiresNamespace: false,
    examples: [`List.reduce([1,4,5], 2, {|acc, el| acc+el})`],
    definitions: [
      makeDefinition(
        "reduce",
        [frArray(frAny), frAny, frLambda],
        ([array, initialValue, lambda], context, reducer) =>
          Ok(
            array.reduce(
              (acc, elem) => lambda.call([acc, elem], context, reducer),
              initialValue
            )
          )
      ),
    ],
  }),
  maker.make({
    name: "reduceReverse",
    requiresNamespace: false,
    examples: [`List.reduceReverse([1,4,5], 2, {|acc, el| acc-el})`],
    definitions: [
      makeDefinition(
        "reduceReverse",
        [frArray(frAny), frAny, frLambda],
        ([array, initialValue, lambda], context, reducer) =>
          Ok(
            [...array]
              .reverse()
              .reduce(
                (acc, elem) => lambda.call([acc, elem], context, reducer),
                initialValue
              )
          )
      ),
    ],
  }),
  maker.make({
    name: "filter",
    requiresNamespace: false,
    examples: [`List.filter([1,4,5], {|x| x>3})`],
    definitions: [
      makeDefinition(
        "filter",
        [frArray(frAny), frLambda],
        ([array, lambda], context, reducer) =>
          Ok(
            vArray(
              array.filter((elem) => {
                const result = lambda.call([elem], context, reducer);
                return result.type === "Bool" && result.value;
              })
            )
          )
      ),
    ],
  }),
  maker.make({
    name: "join",
    requiresNamespace: true,
    examples: [`List.join(["a", "b", "c"], ",")`],
    definitions: [
      makeDefinition(
        "join",
        [frArray(frString), frString],
        ([array, joinStr]) => Ok(vString(array.join(joinStr)))
      ),
      makeDefinition("join", [frArray(frString)], ([array]) =>
        Ok(vString(array.join()))
      ),
    ],
  }),
  maker.make({
    name: "flatten",
    requiresNamespace: true,
    examples: [`List.flatten([[1,2], [3,4]])`],
    definitions: [
      makeDefinition("flatten", [frArray(frAny)], ([arr]) => {
        return Ok(vArray(arr).flatten());
      }),
    ],
  }),
];
