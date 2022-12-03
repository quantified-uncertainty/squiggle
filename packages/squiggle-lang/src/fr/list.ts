import { makeDefinition } from "../library/registry/fnDefinition";
import {
  frAny,
  frArray,
  frLambda,
  frNumber,
} from "../library/registry/frTypes";
import { FnFactory } from "../library/registry/helpers";
import { Ok } from "../utility/result";
import * as Result from "../utility/result";
import { Value, vArray, vNumber } from "../value";
import * as E_A_Floats from "../utility/E_A_Floats";
import { REOther } from "../reducer/ErrorMessage";

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
];
