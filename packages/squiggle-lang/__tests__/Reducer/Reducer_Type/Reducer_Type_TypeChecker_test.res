module Expression = Reducer_Expression
module ExpressionT = Reducer_Expression_T
module ErrorValue = Reducer_ErrorValue
module InternalExpressionValue = ReducerInterface_InternalExpressionValue
module Bindings = Reducer_Bindings
module T = Reducer_Type_T
module TypeChecker = Reducer_Type_TypeChecker

open Jest
open Expect

// In development, you are expected to use TypeChecker.isTypeOf(aTypeSourceCode, result, reducerFn).
// isTypeOfSourceCode is written to use strings instead of expression values.

let isTypeOfSourceCode = (aTypeSourceCode: string, sourceCode: string): result<
  'v,
  ErrorValue.t,
> => {
  let reducerFn = Expression.reduceExpression
  let rResult =
    Reducer.parse(sourceCode)->Belt.Result.flatMap(expr =>
      reducerFn(expr, Bindings.emptyBindings, InternalExpressionValue.defaultEnvironment)
    )
  rResult->Belt.Result.flatMap(result => TypeChecker.isTypeOf(aTypeSourceCode, result, reducerFn))
}

let myTypeCheck = (aTypeSourceCode: string, sourceCode: string): string =>
  switch isTypeOfSourceCode(aTypeSourceCode, sourceCode) {
  | Ok(_) => "Ok"
  | Error(error) => ErrorValue.errorToString(error)
  }

let myTypeCheckExpectEqual = (aTypeSourceCode, sourceCode, answer) =>
  expect(myTypeCheck(aTypeSourceCode, sourceCode))->toEqual(answer)

let myTypeCheckTest = (test, aTypeSourceCode, sourceCode, answer) =>
  test(aTypeSourceCode, () => myTypeCheckExpectEqual(aTypeSourceCode, sourceCode, answer))

myTypeCheckTest(test, "number", "1", "Ok")
myTypeCheckTest(test, "number", "'2'", "Expected type: number but got: '2'")
myTypeCheckTest(test, "string", "3", "Expected type: string but got: 3")
myTypeCheckTest(test, "string", "'a'", "Ok")
myTypeCheckTest(test, "[number]", "[1,2,3]", "Ok")
myTypeCheckTest(test, "[number]", "['a','a','a']", "Expected type: number but got: 'a'")
myTypeCheckTest(test, "[number]", "[1,'a',3]", "Expected type: number but got: 'a'")
myTypeCheckTest(test, "[number, string]", "[1,'a']", "Ok")
myTypeCheckTest(test, "[number, string]", "[1, 2]", "Expected type: string but got: 2")
myTypeCheckTest(
  test,
  "[number, string, string]",
  "[1,'a']",
  "Expected type: [number, string, string] but got: [1,'a']",
)
myTypeCheckTest(
  test,
  "[number, string]",
  "[1,'a', 3]",
  "Expected type: [number, string] but got: [1,'a',3]",
)
myTypeCheckTest(test, "{age: number, name: string}", "{age: 1, name: 'a'}", "Ok")
myTypeCheckTest(
  test,
  "{age: number, name: string}",
  "{age: 1, name: 'a', job: 'IT'}",
  "Expected type: {age: number, name: string} but got: {age: 1,job: 'IT',name: 'a'}",
)
myTypeCheckTest(test, "number | string", "1", "Ok")
myTypeCheckTest(test, "date | string", "1", "Expected type: (date | string) but got: 1")
myTypeCheckTest(test, "number<-min(10)", "10", "Ok")
myTypeCheckTest(test, "number<-min(10)", "0", "Expected type: number<-min(10) but got: 0")
myTypeCheckTest(test, "any", "0", "Ok")
myTypeCheckTest(test, "any", "'a'", "Ok")
