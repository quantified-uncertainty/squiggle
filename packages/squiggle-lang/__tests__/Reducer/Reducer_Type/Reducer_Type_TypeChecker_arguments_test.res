module Expression = Reducer_Expression
module ExpressionT = Reducer_Expression_T
module ErrorValue = Reducer_ErrorValue
module InternalExpressionValue = ReducerInterface_InternalExpressionValue
module Module = Reducer_Module
module T = Reducer_Type_T
module TypeChecker = Reducer_Type_TypeChecker

open Jest
open Expect

let checkArgumentsSourceCode = (aTypeSourceCode: string, sourceCode: string): result<
  'v,
  ErrorValue.t,
> => {
  let reducerFn = Expression.reduceExpression
  let rResult =
    Reducer.parse(sourceCode)->Belt.Result.flatMap(expr =>
      reducerFn(expr, Module.emptyBindings, InternalExpressionValue.defaultEnvironment)
    )
  rResult->Belt.Result.flatMap(result =>
    switch result {
    | IEvArray(args) => TypeChecker.checkArguments(aTypeSourceCode, args, reducerFn)
    | _ => Js.Exn.raiseError("Arguments has to be an array")
    }
  )
}

let myCheckArguments = (aTypeSourceCode: string, sourceCode: string): string =>
  switch checkArgumentsSourceCode(aTypeSourceCode, sourceCode) {
  | Ok(_) => "Ok"
  | Error(error) => ErrorValue.errorToString(error)
  }

let myCheckArgumentsExpectEqual = (aTypeSourceCode, sourceCode, answer) =>
  expect(myCheckArguments(aTypeSourceCode, sourceCode))->toEqual(answer)

let _myCheckArgumentsTest = (test, aTypeSourceCode, sourceCode, answer) =>
  test(aTypeSourceCode, () => myCheckArgumentsExpectEqual(aTypeSourceCode, sourceCode, answer))

let myCheckArgumentsTest = (aTypeSourceCode, sourceCode, answer) =>
  _myCheckArgumentsTest(test, aTypeSourceCode, sourceCode, answer)
module MySkip = {
  let myCheckArgumentsTest = (aTypeSourceCode, sourceCode, answer) =>
    _myCheckArgumentsTest(Skip.test, aTypeSourceCode, sourceCode, answer)
}
module MyOnly = {
  let myCheckArgumentsTest = (aTypeSourceCode, sourceCode, answer) =>
    _myCheckArgumentsTest(Only.test, aTypeSourceCode, sourceCode, answer)
}

myCheckArgumentsTest("number=>number=>number", "[1,2]", "Ok")
