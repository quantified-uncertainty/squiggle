module Expression = Reducer_Expression
module ExpressionT = Reducer_Expression_T
module ErrorValue = Reducer_ErrorValue
module InternalExpressionValue = ReducerInterface_InternalExpressionValue
module Module = Reducer_Module
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
      reducerFn(expr, Module.emptyBindings, InternalExpressionValue.defaultEnvironment)
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

let _myTypeCheckTest = (test, aTypeSourceCode, sourceCode, answer) =>
  test(aTypeSourceCode, () => myTypeCheckExpectEqual(aTypeSourceCode, sourceCode, answer))

let myTypeCheckTest = (aTypeSourceCode, sourceCode, answer) =>
  _myTypeCheckTest(test, aTypeSourceCode, sourceCode, answer)
module MySkip = {
  let myTypeCheckTest = (aTypeSourceCode, sourceCode, answer) =>
    _myTypeCheckTest(Skip.test, aTypeSourceCode, sourceCode, answer)
}
module MyOnly = {
  let myTypeCheckTest = (aTypeSourceCode, sourceCode, answer) =>
    _myTypeCheckTest(Only.test, aTypeSourceCode, sourceCode, answer)
}

myTypeCheckTest("number", "1", "Ok")
myTypeCheckTest("number", "'2'", "Expected type: number but got: '2'")
myTypeCheckTest("string", "3", "Expected type: string but got: 3")
myTypeCheckTest("string", "'a'", "Ok")
myTypeCheckTest("[number]", "[1,2,3]", "Ok")
myTypeCheckTest("[number]", "['a','a','a']", "Expected type: number but got: 'a'")
myTypeCheckTest("[number]", "[1,'a',3]", "Expected type: number but got: 'a'")
myTypeCheckTest("[number, string]", "[1,'a']", "Ok")
myTypeCheckTest("[number, string]", "[1, 2]", "Expected type: string but got: 2")
myTypeCheckTest(
  "[number, string, string]",
  "[1,'a']",
  "Expected type: [number, string, string] but got: [1,'a']",
)
myTypeCheckTest(
  "[number, string]",
  "[1,'a', 3]",
  "Expected type: [number, string] but got: [1,'a',3]",
)
myTypeCheckTest("{age: number, name: string}", "{age: 1, name: 'a'}", "Ok")
myTypeCheckTest(
  "{age: number, name: string}",
  "{age: 1, name: 'a', job: 'IT'}",
  "Expected type: {age: number, name: string} but got: {age: 1,job: 'IT',name: 'a'}",
)
myTypeCheckTest("number | string", "1", "Ok")
myTypeCheckTest("date | string", "1", "Expected type: (date | string) but got: 1")
myTypeCheckTest("number<-min(10)", "10", "Ok")
myTypeCheckTest("number<-min(10)", "0", "Expected type: number<-min(10) but got: 0")
