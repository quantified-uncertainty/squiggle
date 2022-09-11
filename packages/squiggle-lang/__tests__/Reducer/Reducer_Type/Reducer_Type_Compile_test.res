// module Expression = Reducer_Expression
// module InternalExpressionValue = ReducerInterface_InternalExpressionValue
// module Bindings = Reducer_Bindings
// module T = Reducer_Type_T
// module TypeCompile = Reducer_Type_Compile

// open Jest
// open Expect

// let myIevEval = (aTypeSourceCode: string) =>
//   TypeCompile.ievFromTypeExpression(aTypeSourceCode, Expression.reduceExpressionInProject)
// let myIevEvalToString = (aTypeSourceCode: string) =>
//   myIevEval(aTypeSourceCode)->InternalExpressionValue.toStringResult

// let myIevExpectEqual = (aTypeSourceCode, answer) =>
//   expect(myIevEvalToString(aTypeSourceCode))->toEqual(answer)

// let myIevTest = (test, aTypeSourceCode, answer) =>
//   test(aTypeSourceCode, () => myIevExpectEqual(aTypeSourceCode, answer))

// let myTypeEval = (aTypeSourceCode: string) =>
//   TypeCompile.fromTypeExpression(aTypeSourceCode, Expression.reduceExpressionInProject)
// let myTypeEvalToString = (aTypeSourceCode: string) => myTypeEval(aTypeSourceCode)->T.toStringResult

// let myTypeExpectEqual = (aTypeSourceCode, answer) =>
//   expect(myTypeEvalToString(aTypeSourceCode))->toEqual(answer)

// let myTypeTest = (test, aTypeSourceCode, answer) =>
//   test(aTypeSourceCode, () => myTypeExpectEqual(aTypeSourceCode, answer))

// //   | ItTypeIdentifier(string)
// myTypeTest(test, "number", "number")
// myTypeTest(test, "(number)", "number")
// //   | ItModifiedType({modifiedType: iType})
// myIevTest(test, "number<-min(0)", "Ok({min: 0,typeIdentifier: #number,typeTag: 'typeIdentifier'})")
// myTypeTest(test, "number<-min(0)", "number<-min(0)")
// //   | ItTypeOr({typeOr: array<iType>})
// myTypeTest(test, "number | string", "(number | string)")
// //   | ItTypeFunction({inputs: array<iType>, output: iType})
// myTypeTest(test, "number => number => number", "(number => number => number)")
// //   | ItTypeArray({element: iType})
// myIevTest(test, "[number]", "Ok({element: #number,typeTag: 'typeArray'})")
// myTypeTest(test, "[number]", "[number]")
// //   | ItTypeTuple({elements: array<iType>})
// myTypeTest(test, "[number, string]", "[number, string]")
// //   | ItTypeRecord({properties: Belt.Map.String.t<iType>})
// myIevTest(
//   test,
//   "{age: number, name: string}",
//   "Ok({properties: {age: #number,name: #string},typeTag: 'typeRecord'})",
// )
// myTypeTest(test, "{age: number, name: string}", "{age: number, name: string}")
