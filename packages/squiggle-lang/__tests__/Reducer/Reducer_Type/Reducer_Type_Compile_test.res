module Expression = Reducer_Expression
module InternalExpressionValue = ReducerInterface_InternalExpressionValue
module Bindings = Reducer_Bindings
module T = Reducer_Type_T
module TypeCompile = Reducer_Type_Compile

open Jest
open Expect

let myIevEval = (aTypeSourceCode: string) =>
  TypeCompile.ievFromTypeExpression(aTypeSourceCode, Expression.reduceExpression)
let myIevEvalToString = (aTypeSourceCode: string) =>
  myIevEval(aTypeSourceCode)->InternalExpressionValue.toStringResult

let myIevExpectEqual = (aTypeSourceCode, answer) =>
  expect(myIevEvalToString(aTypeSourceCode))->toEqual(answer)

let _myIevTest = (test, aTypeSourceCode, answer) =>
  test(aTypeSourceCode, () => myIevExpectEqual(aTypeSourceCode, answer))

let myTypeEval = (aTypeSourceCode: string) =>
  TypeCompile.fromTypeExpression(aTypeSourceCode, Expression.reduceExpression)
let myTypeEvalToString = (aTypeSourceCode: string) => myTypeEval(aTypeSourceCode)->T.toStringResult

let myTypeExpectEqual = (aTypeSourceCode, answer) =>
  expect(myTypeEvalToString(aTypeSourceCode))->toEqual(answer)

let _myTypeTest = (test, aTypeSourceCode, answer) =>
  test(aTypeSourceCode, () => myTypeExpectEqual(aTypeSourceCode, answer))

let myIevTest = (aTypeSourceCode, answer) => _myIevTest(test, aTypeSourceCode, answer)
let myTypeTest = (aTypeSourceCode, answer) => _myTypeTest(test, aTypeSourceCode, answer)
module MySkip = {
  let myIevTest = (aTypeSourceCode, answer) => _myIevTest(Skip.test, aTypeSourceCode, answer)
  let myTypeTest = (aTypeSourceCode, answer) => _myTypeTest(Skip.test, aTypeSourceCode, answer)
}
module MyOnly = {
  let myIevTest = (aTypeSourceCode, answer) => _myIevTest(Only.test, aTypeSourceCode, answer)
  let myTypeTest = (aTypeSourceCode, answer) => _myTypeTest(Only.test, aTypeSourceCode, answer)
}

//   | ItTypeIdentifier(string)
myTypeTest("number", "number")
myTypeTest("(number)", "number")
//   | ItModifiedType({modifiedType: iType})
myIevTest("number<-min(0)", "Ok({min: 0,typeIdentifier: #number,typeTag: 'typeIdentifier'})")
myTypeTest("number<-min(0)", "number<-min(0)")
//   | ItTypeOr({typeOr: array<iType>})
myTypeTest("number | string", "(number | string)")
//   | ItTypeFunction({inputs: array<iType>, output: iType})
myTypeTest("number => number => number", "(number => number => number)")
//   | ItTypeArray({element: iType})
myIevTest("[number]", "Ok({element: #number,typeTag: 'typeArray'})")
myTypeTest("[number]", "[number]")
//   | ItTypeTuple({elements: array<iType>})
myTypeTest("[number, string]", "[number, string]")
//   | ItTypeRecord({properties: Belt.Map.String.t<iType>})
myIevTest(
  "{age: number, name: string}",
  "Ok({properties: {age: #number,name: #string},typeTag: 'typeRecord'})",
)
myTypeTest("{age: number, name: string}", "{age: number, name: string}")
