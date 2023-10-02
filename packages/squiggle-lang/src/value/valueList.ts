import { REOther } from "../errors/messages.js";
import { Value, vNumber } from "../value/index.js";
import { Lambda } from "../reducer/lambda.js";
import { ReducerContext } from "../reducer/context.js";

export function makeFromLambda(
  n: number,
  lambda: Lambda,
  context: ReducerContext
): Value[] {
  const parameterLength = lambda.getParameterNames().length;

  if (parameterLength === 0) {
    return Array.from({ length: n }, (_) => lambda.call([], context));
  } else if (parameterLength === 1) {
    return Array.from({ length: n }, (_, i) =>
      lambda.call([vNumber(i)], context)
    );
  } else {
    throw new REOther("Expected function with 0 or 1 parameters");
  }
}

export function map(
  array: Value[],
  lambda: Lambda,
  context: ReducerContext
): Value[] {
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
  context: ReducerContext
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
  context: ReducerContext
): Value {
  return reduce([...array].reverse(), initialValue, lambda, context);
}

export function reduceWhile(
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
