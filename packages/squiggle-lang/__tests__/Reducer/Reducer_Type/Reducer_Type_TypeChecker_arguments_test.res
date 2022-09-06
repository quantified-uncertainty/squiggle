module Bindings = Reducer_Bindings
module ErrorValue = Reducer_ErrorValue
module Expression = Reducer_Expression
module ExpressionT = Reducer_Expression_T
module InternalExpressionValue = ReducerInterface_InternalExpressionValue
module ProjectAccessorsT = ReducerProject_ProjectAccessors_T
module T = Reducer_Type_T
module TypeChecker = Reducer_Type_TypeChecker

open Jest
open Expect

let checkArgumentsSourceCode = (aTypeSourceCode: string, sourceCode: string): result<
  'v,
  ErrorValue.t,
> => {
  let reducerFn = Expression.reduceExpressionInProject
  let rResult =
    Expression.BackCompatible.parse(sourceCode)->Belt.Result.flatMap(expr =>
      reducerFn(expr, Bindings.emptyBindings, ProjectAccessorsT.identityAccessors)
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

let myCheckArgumentsTest = (test, aTypeSourceCode, sourceCode, answer) =>
  test(aTypeSourceCode, () => myCheckArgumentsExpectEqual(aTypeSourceCode, sourceCode, answer))

myCheckArgumentsTest(test, "number=>number=>number", "[1,2]", "Ok")
