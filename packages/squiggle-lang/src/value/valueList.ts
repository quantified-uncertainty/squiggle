import { REOther } from "../errors/messages.js";
import * as E_A_Floats from "../utility/E_A_Floats.js";
import { Value, isEqual, vNumber } from "../value/index.js";
import { Lambda } from "../reducer/lambda.js";

const throwErrorIfInvalidArrayLength = (number: number) => {
  if (number < 0) {
    throw new REOther("Expected non-negative number");
  } else if (!Number.isInteger(number)) {
    throw new REOther("Number must be an integer");
  }
};

//This assumes that the type is uniqable if it has an isEqual method.
const isUniqableType = (t: Value) => "isEqual" in t;

function _expect1ParamsLength(lambda: Lambda, len: number): void {
  if (lambda.getParameterNames().length !== len) {
    throw new REOther(`Expected function with ${len} parameters`);
  }
}

function _expect2ParamsLength(
  lambda: Lambda,
  first: number,
  second: number
): void {
  const parameters = lambda.getParameterNames().length;
  if (parameters !== first && parameters !== second) {
    throw new REOther(
      `Expected function with ${first} or ${second} parameters`
    );
  }
}

function _binaryLambdaCheck1(
  lambda: Lambda,
  context: any
): (e: Value) => boolean {
  return (el: Value) => {
    const result = lambda.call([el], context);
    return result.type === "Bool" && result.value;
  };
}

function _binaryLambdaCheck2(
  parameterLength: number, // should be 1 or 2
  lambda: Lambda,
  context: any
): (e: Value, i: number) => boolean {
  return (el: Value, index) => {
    const inputs = parameterLength === 1 ? [el] : [el, vNumber(index)];
    const result = lambda.call(inputs, context);
    return result.type === "Bool" && result.value;
  };
}

function _findArrayElement(
  array: Value[],
  lambda: Lambda,
  context: any
): Value {
  const parameters = lambda.getParameterNames().length;
  _expect2ParamsLength(lambda, 1, 2);
  const result = array.find(_binaryLambdaCheck2(parameters, lambda, context));
  if (result === undefined) {
    throw new REOther("No element found");
  }
  return result;
}

function _findArrayIndex(array: Value[], lambda: Lambda, context: any): number {
  _expect1ParamsLength(lambda, 1);
  const index = array.findIndex(_binaryLambdaCheck1(lambda, context));
  return index;
}

export function makeFromLambda(
  n: number,
  lambda: Lambda,
  context: any
): Value[] {
  throwErrorIfInvalidArrayLength(n);
  const parameterLength = lambda.getParameterNames().length;
  const runLambda = (fn: (i: number) => Value[]) => {
    return Array.from({ length: n }, (_, index) =>
      lambda.call(fn(index), context)
    );
  };
  if (parameterLength === 0) {
    return runLambda((_index) => []);
  } else if (parameterLength === 1) {
    return runLambda((index) => [vNumber(index)]);
  } else {
    throw new REOther("Expeced lambda with 0 or 1 parameters");
  }
}

export function makeFromValue(n: number, fill: Value): Value[] {
  throwErrorIfInvalidArrayLength(n);
  return new Array(n).fill(fill);
}

export function makeFromSampleSet(n: number, fill: Value): Value[] {
  throwErrorIfInvalidArrayLength(n);
  return new Array(n).fill(fill);
}

export function upTo(low: number, high: number): Value[] {
  return E_A_Floats.range(low, high, (high - low + 1) | 0).map(vNumber);
}

export function first(array: Value[]): Value {
  if (!array.length) {
    throw new REOther("No first element");
  } else {
    return array[0];
  }
}

export function last(array: Value[]): Value {
  if (!array.length) {
    throw new REOther("No last element");
  } else {
    return array[array.length - 1];
  }
}

export function uniq(array: Value[]): Value[] {
  const uniqueArray: Value[] = [];

  for (const item of array) {
    if (!isUniqableType(item)) {
      throw new REOther(`Can't apply uniq() to element with type ${item.type}`);
    }
    if (!uniqueArray.some((existingItem) => isEqual(existingItem, item))) {
      uniqueArray.push(item);
    }
  }

  return uniqueArray;
}

export function uniqBy(array: Value[], lambda: Lambda, context: any): Value[] {
  _expect1ParamsLength(lambda, 1);
  const seen: Value[] = [];
  const result: Value[] = [];

  for (const item of array) {
    const computed = lambda.call([item], context);
    if (!isUniqableType(computed)) {
      throw new REOther(
        `Can't apply uniq() to element with type ${computed.type}`
      );
    }
    if (!seen.some((existingItem) => isEqual(existingItem, computed))) {
      seen.push(computed);
      result.push(item);
    }
  }

  return result;
}

export function filter(array: Value[], lambda: Lambda, context: any): Value[] {
  _expect1ParamsLength(lambda, 1);
  return array.filter(_binaryLambdaCheck1(lambda, context));
}

export function every(array: Value[], lambda: Lambda, context: any): boolean {
  _expect1ParamsLength(lambda, 1);
  return array.every(_binaryLambdaCheck1(lambda, context));
}

export function some(array: Value[], lambda: Lambda, context: any): boolean {
  _expect1ParamsLength(lambda, 1);
  return array.some(_binaryLambdaCheck1(lambda, context));
}

export function find(array: Value[], lambda: Lambda, context: any): Value {
  _expect1ParamsLength(lambda, 1);
  return _findArrayElement(array, lambda, context);
}

export function findIndex(
  array: Value[],
  lambda: Lambda,
  context: any
): number {
  return _findArrayIndex(array, lambda, context);
}

export function map(array: Value[], lambda: Lambda, context: any): Value[] {
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
    throw new REOther("Expected function with 1 or 2 parameters");
  }
  return mapped;
}

export function reduce(
  array: Value[],
  initialValue: Value,
  lambda: Lambda,
  context: any
): Value {
  const parameters = lambda.getParameterNames().length;
  if (parameters === 2) {
    return array.reduce(
      (acc, elem) => lambda.call([acc, elem], context),
      initialValue
    );
  } else if (parameters === 3) {
    return array.reduce(
      (acc, elem, index) => lambda.call([acc, elem, vNumber(index)], context),
      initialValue
    );
  } else {
    throw new REOther("Expected function with 2 or 3 parameters");
  }
}

export function reduceReverse(
  array: Value[],
  initialValue: Value,
  lambda: Lambda,
  context: any
): Value {
  return reduce([...array].reverse(), initialValue, lambda, context);
}

export function reduceWhile(
  array: Value[],
  initialValue: Value,
  step: Lambda,
  condition: Lambda,
  context: any
): Value {
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
