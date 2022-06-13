open Jest
open Reducer_Peggy_TestHelpers

describe("Peggy Types to Expression", () => {
  describe("type of", () => {
    testToExpression(
      "p: number",
      "{(:$_typeOf_$ :p #number)}",
      ~v="{_typeReferences_: {p: #number}}",
      (),
    )
  })
  describe("type alias", () => {
    testToExpression(
      "type index=number",
      "{(:$_typeAlias_$ #index #number)}",
      ~v="{_typeAliases_: {index: #number}}",
      (),
    )
  })
  describe("type or", () => {
    testToExpression(
      "answer: number|string|distribution",
      "{(:$_typeOf_$ :answer (:$_typeOr_$ (:$_constructArray_$ (#number #string #distribution))))}",
      ~v="{_typeReferences_: {answer: {typeTag: 'typeOr',typeOr: [#number,#string,#distribution]}}}",
      (),
    )
  })
  describe("type function", () => {
    testToExpression(
      "f: number=>number=>number",
      "{(:$_typeOf_$ :f (:$_typeFunction_$ (:$_constructArray_$ (#number #number #number))))}",
      ~v="{_typeReferences_: {f: {typeTag: 'typeFunction',inputs: [#number,#number],output: #number}}}",
      (),
    )
    testToExpression(
      "f: number=>number",
      "{(:$_typeOf_$ :f (:$_typeFunction_$ (:$_constructArray_$ (#number #number))))}",
      ~v="{_typeReferences_: {f: {typeTag: 'typeFunction',inputs: [#number],output: #number}}}",
      (),
    )
  })
  describe("high priority modifier", () => {
    testToExpression(
      "answer: number<-min(1)<-max(100)|string",
      "{(:$_typeOf_$ :answer (:$_typeOr_$ (:$_constructArray_$ ((:$_typeModifier_max_$ (:$_typeModifier_min_$ #number 1) 100) #string))))}",
      ~v="{_typeReferences_: {answer: {typeTag: 'typeOr',typeOr: [{typeTag: 'typeIdentifier',typeIdentifier: #number,min: 1,max: 100},#string]}}}",
      (),
    )
    testToExpression(
      "answer: number<-memberOf([1,3,5])",
      "{(:$_typeOf_$ :answer (:$_typeModifier_memberOf_$ #number (:$_constructArray_$ (1 3 5))))}",
      ~v="{_typeReferences_: {answer: {typeTag: 'typeIdentifier',typeIdentifier: #number,memberOf: [1,3,5]}}}",
      (),
    )
    testToExpression(
      "answer: number<-min(1)",
      "{(:$_typeOf_$ :answer (:$_typeModifier_min_$ #number 1))}",
      ~v="{_typeReferences_: {answer: {typeTag: 'typeIdentifier',typeIdentifier: #number,min: 1}}}",
      (),
    )
    testToExpression(
      "answer: number<-max(10)",
      "{(:$_typeOf_$ :answer (:$_typeModifier_max_$ #number 10))}",
      ~v="{_typeReferences_: {answer: {typeTag: 'typeIdentifier',typeIdentifier: #number,max: 10}}}",
      (),
    )
    testToExpression(
      "answer: number<-min(1)<-max(10)",
      "{(:$_typeOf_$ :answer (:$_typeModifier_max_$ (:$_typeModifier_min_$ #number 1) 10))}",
      ~v="{_typeReferences_: {answer: {typeTag: 'typeIdentifier',typeIdentifier: #number,min: 1,max: 10}}}",
      (),
    )
    testToExpression(
      "answer: number<-max(10)<-min(1)",
      "{(:$_typeOf_$ :answer (:$_typeModifier_min_$ (:$_typeModifier_max_$ #number 10) 1))}",
      ~v="{_typeReferences_: {answer: {typeTag: 'typeIdentifier',typeIdentifier: #number,max: 10,min: 1}}}",
      (),
    )
  })
  describe("low priority modifier", () => {
    testToExpression(
      "answer: number | string $ opaque",
      "{(:$_typeOf_$ :answer (:$_typeModifier_opaque_$ (:$_typeOr_$ (:$_constructArray_$ (#number #string)))))}",
      ~v="{_typeReferences_: {answer: {typeTag: 'typeOr',typeOr: [#number,#string],opaque: true}}}",
      (),
    )
  })
  describe("squiggle expressions in type modifiers", () => {
    testToExpression(
      "odds1 = [1,3,5]; odds2 = [7, 9]; type odds = number<-memberOf(concat(odds1, odds2))",
      "{(:$_let_$ :odds1 {(:$_constructArray_$ (1 3 5))}); (:$_let_$ :odds2 {(:$_constructArray_$ (7 9))}); (:$_typeAlias_$ #odds (:$_typeModifier_memberOf_$ #number (:concat :odds1 :odds2)))}",
      ~v="{_typeAliases_: {odds: {typeTag: 'typeIdentifier',typeIdentifier: #number,memberOf: [1,3,5,7,9]}},odds1: [1,3,5],odds2: [7,9]}",
      (),
    )
  })
  // TODO: type bindings. Type bindings are not yet supported.
  // TODO: type constructor
})
