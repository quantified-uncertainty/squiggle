import { testParse } from "../helpers/reducerHelpers.js";

describe("Peggy parse type", () => {
  describe("type of", () => {
    testParse(
      "p: number",
      "{(::$_typeOf_$ :p #number); (::$_endOfOuterBlock_$ () ())}"
    );
  });
  describe("type alias", () => {
    testParse(
      "type index=number",
      "{(::$_typeAlias_$ #index #number); (::$_endOfOuterBlock_$ () ())}"
    );
  });
  describe("type or", () => {
    testParse(
      "answer: number|string",
      "{(::$_typeOf_$ :answer (::$_typeOr_$ (::$_constructArray_$ #number #string))); (::$_endOfOuterBlock_$ () ())}"
    );
  });
  describe("type function", () => {
    testParse(
      "f: number=>number=>number",
      "{(::$_typeOf_$ :f (::$_typeFunction_$ (::$_constructArray_$ #number #number #number))); (::$_endOfOuterBlock_$ () ())}"
    );
  });
  describe("high priority contract", () => {
    testParse(
      "answer: number<-min<-max(100)|string",
      "{(::$_typeOf_$ :answer (::$_typeOr_$ (::$_constructArray_$ (::$_typeModifier_max_$ (::$_typeModifier_min_$ #number) 100) #string))); (::$_endOfOuterBlock_$ () ())}"
    );
    testParse(
      "answer: number<-memberOf([1,3,5])",
      "{(::$_typeOf_$ :answer (::$_typeModifier_memberOf_$ #number (::$_constructArray_$ 1 3 5))); (::$_endOfOuterBlock_$ () ())}"
    );
  });
  describe("low priority contract", () => {
    testParse(
      "answer: number | string $ opaque",
      "{(::$_typeOf_$ :answer (::$_typeModifier_opaque_$ (::$_typeOr_$ (::$_constructArray_$ #number #string)))); (::$_endOfOuterBlock_$ () ())}"
    );
  });
  describe("type array", () => {
    testParse(
      "answer: [number]",
      "{(::$_typeOf_$ :answer (::$_typeArray_$ #number)); (::$_endOfOuterBlock_$ () ())}"
    );
  });
  describe("type dict", () => {
    testParse(
      "answer: {a: number, b: string}",
      "{(::$_typeOf_$ :answer (::$_typeDict_$ (::$_constructDict_$ ('a': #number 'b': #string)))); (::$_endOfOuterBlock_$ () ())}"
    );
  });
  describe("type constructor", () => {
    testParse(
      "answer: Age(number)",
      "{(::$_typeOf_$ :answer (::$_typeConstructor_$ #Age (::$_constructArray_$ #number))); (::$_endOfOuterBlock_$ () ())}"
    );
    testParse(
      "answer: Complex(number, number)",
      "{(::$_typeOf_$ :answer (::$_typeConstructor_$ #Complex (::$_constructArray_$ #number #number))); (::$_endOfOuterBlock_$ () ())}"
    );
    testParse(
      "answer: Person({age: number, name: string})",
      "{(::$_typeOf_$ :answer (::$_typeConstructor_$ #Person (::$_constructArray_$ (::$_typeDict_$ (::$_constructDict$ ('age': #number 'name': #string)))))); (::$_endOfOuterBlock_$ () ())}"
    );
    testParse(
      "weekend: Saturday | Sunday",
      "{(::$_typeOf_$ :weekend (::$_typeOr_$ (::$_constructArray_$ (::$_typeConstructor_$ #Saturday (::$_constructArray_$)) (::$_typeConstructor_$ #Sunday (::$_constructArray_$))))); (::$_endOfOuterBlock_$ () ())}"
    );
  });
  describe("type parenthesis", () => {
    //$ is introduced to avoid parenthesis
    testParse(
      "answer: (number|string)<-opaque",
      "{(::$_typeOf_$ :answer (::$_typeModifier_opaque_$ (::$_typeOr_$ (::$_constructArray_$ #number #string)))); (::$_endOfOuterBlock_$ () ())}"
    );
  });
  describe("squiggle expressions in type contracts", () => {
    testParse(
      "odds1 = [1,3,5]; odds2 = [7, 9]; type odds = number<-memberOf(concat(odds1, odds2))",
      "{:odds1 = {(::$_constructArray_$ 1 3 5)}; :odds2 = {(::$_constructArray_$ 7 9)}; (::$_typeAlias_$ #odds (::$_typeModifier_memberOf_$ #number (::concat :odds1 :odds2))); (::$_endOfOuterBlock_$ () ())}"
    );
  });
});
