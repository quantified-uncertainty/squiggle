import { testToExpression } from "../helpers/reducerHelpers.js";

describe("Peggy Types to Expression", () => {
  describe("type of", () => {
    testToExpression(
      "p: number",
      "{(:$_typeOf_$ :p #number); (:$_endOfOuterBlock_$ () ())}"
      // "@{_typeReferences_: {p: #number}}",
    );
  });
  describe("type alias", () => {
    testToExpression(
      "type index=number",
      "{(:$_typeAlias_$ #index #number); (:$_endOfOuterBlock_$ () ())}"
      // "@{_typeAliases_: {index: #number}}",
    );
  });
  describe("type or", () => {
    testToExpression(
      "answer: number|string|distribution",
      "{(:$_typeOf_$ :answer (:$_typeOr_$ (:$_constructArray_$ #number #string #distribution))); (:$_endOfOuterBlock_$ () ())}"
      // "@{_typeReferences_: {answer: {typeOr: [#number,#string,#distribution],typeTag: 'typeOr'}}}",
    );
  });
  describe("type function", () => {
    testToExpression(
      "f: number=>number=>number",
      "{(:$_typeOf_$ :f (:$_typeFunction_$ (:$_constructArray_$ #number #number #number))); (:$_endOfOuterBlock_$ () ())}"
      // "@{_typeReferences_: {f: {inputs: [#number,#number],output: #number,typeTag: 'typeFunction'}}}",
    );
    testToExpression(
      "f: number=>number",
      "{(:$_typeOf_$ :f (:$_typeFunction_$ (:$_constructArray_$ #number #number))); (:$_endOfOuterBlock_$ () ())}"
      // "@{_typeReferences_: {f: {inputs: [#number],output: #number,typeTag: 'typeFunction'}}}",
    );
  });
  describe("high priority contract", () => {
    testToExpression(
      "answer: number<-min(1)<-max(100)|string",
      "{(:$_typeOf_$ :answer (:$_typeOr_$ (:$_constructArray_$ (:$_typeModifier_max_$ (:$_typeModifier_min_$ #number 1) 100) #string))); (:$_endOfOuterBlock_$ () ())}"
      // "@{_typeReferences_: {answer: {typeOr: [{max: 100,min: 1,typeIdentifier: #number,typeTag: 'typeIdentifier'},#string],typeTag: 'typeOr'}}}",
    );
    testToExpression(
      "answer: number<-memberOf([1,3,5])",
      "{(:$_typeOf_$ :answer (:$_typeModifier_memberOf_$ #number (:$_constructArray_$ 1 3 5))); (:$_endOfOuterBlock_$ () ())}"
      // "@{_typeReferences_: {answer: {memberOf: [1,3,5],typeIdentifier: #number,typeTag: 'typeIdentifier'}}}",
    );
    testToExpression(
      "answer: number<-min(1)",
      "{(:$_typeOf_$ :answer (:$_typeModifier_min_$ #number 1)); (:$_endOfOuterBlock_$ () ())}"
      // "@{_typeReferences_: {answer: {min: 1,typeIdentifier: #number,typeTag: 'typeIdentifier'}}}",
    );
    testToExpression(
      "answer: number<-max(10)",
      "{(:$_typeOf_$ :answer (:$_typeModifier_max_$ #number 10)); (:$_endOfOuterBlock_$ () ())}"
      // "@{_typeReferences_: {answer: {max: 10,typeIdentifier: #number,typeTag: 'typeIdentifier'}}}",
    );
    testToExpression(
      "answer: number<-min(1)<-max(10)",
      "{(:$_typeOf_$ :answer (:$_typeModifier_max_$ (:$_typeModifier_min_$ #number 1) 10)); (:$_endOfOuterBlock_$ () ())}"
      // "@{_typeReferences_: {answer: {max: 10,min: 1,typeIdentifier: #number,typeTag: 'typeIdentifier'}}}",
    );
    testToExpression(
      "answer: number<-max(10)<-min(1)",
      "{(:$_typeOf_$ :answer (:$_typeModifier_min_$ (:$_typeModifier_max_$ #number 10) 1)); (:$_endOfOuterBlock_$ () ())}"
      // "@{_typeReferences_: {answer: {max: 10,min: 1,typeIdentifier: #number,typeTag: 'typeIdentifier'}}}",
    );
  });
  describe("low priority contract", () => {
    testToExpression(
      "answer: number | string $ opaque",
      "{(:$_typeOf_$ :answer (:$_typeModifier_opaque_$ (:$_typeOr_$ (:$_constructArray_$ #number #string)))); (:$_endOfOuterBlock_$ () ())}"
      // "@{_typeReferences_: {answer: {opaque: true,typeOr: [#number,#string],typeTag: 'typeOr'}}}",
    );
  });
  describe("squiggle expressions in type contracts", () => {
    testToExpression(
      "odds1 = [1,3,5]; odds2 = [7, 9]; type odds = number<-memberOf(concat(odds1, odds2))",
      "{(:$_let_$ :odds1 {(:$_constructArray_$ 1 3 5)}); (:$_let_$ :odds2 {(:$_constructArray_$ 7 9)}); (:$_typeAlias_$ #odds (:$_typeModifier_memberOf_$ #number (:concat :odds1 :odds2))); (:$_endOfOuterBlock_$ () ())}"
      // "@{_typeAliases_: {odds: {memberOf: [1,3,5,7,9],typeIdentifier: #number,typeTag: 'typeIdentifier'}},odds1: [1,3,5],odds2: [7,9]}",
    );
  });
  // TODO: type bindings. Type bindings are not yet supported.
  // TODO: type constructor
});
