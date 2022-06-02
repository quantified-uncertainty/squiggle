open Jest
open Reducer_Peggy_TestHelpers

describe("Peggy parse type", () => {
  describe("type of", () => {
    testParse("p: number", "{(::$_typeOf_$ :p #number)}")
  })
  describe("type alias", () => {
    testParse("type index=number", "{(::$_typeAlias_$ #index #number)}")
  })
  describe("type or", () => {
    testParse(
      "answer: number|string",
      "{(::$_typeOf_$ :answer (::$_typeOr_$ (::$_constructArray_$ (#number #string))))}",
    )
  })
  describe("type function", () => {
    testParse(
      "f: number=>number=>number",
      "{(::$_typeOf_$ :f (::$_typeFunction_$ (::$_constructArray_$ (#number #number #number))))}",
    )
  })
  describe("high priority modifier", () => {
    testParse(
      "answer: number<-min<-max(100)|string",
      "{(::$_typeOf_$ :answer (::$_typeOr_$ (::$_constructArray_$ ((::$_typeModifier_max_$ (::$_typeModifier_min_$ #number) 100) #string))))}",
    )
    testParse(
      "answer: number<-memberOf([1,3,5])",
      "{(::$_typeOf_$ :answer (::$_typeModifier_memberOf_$ #number (::$_constructArray_$ (1 3 5))))}",
    )
  })
  describe("low priority modifier", () => {
    testParse(
      "answer: number | string $ opaque",
      "{(::$_typeOf_$ :answer (::$_typeModifier_opaque_$ (::$_typeOr_$ (::$_constructArray_$ (#number #string)))))}",
    )
  })
  describe("type array", () => {
    testParse("answer: [number]", "{(::$_typeOf_$ :answer (::$_typeArray_$ #number))}")
  })
  describe("type record", () => {
    testParse(
      "answer: {a: number, b: string}",
      "{(::$_typeOf_$ :answer (::$_typeRecord_$ (::$_constructRecord_$ ('a': #number 'b': #string))))}",
    )
  })
  describe("type constructor", () => {
    testParse(
      "answer: Age(number)",
      "{(::$_typeOf_$ :answer (::$_typeConstructor_$ #Age (::$_constructArray_$ (#number))))}",
    )
    testParse(
      "answer: Complex(number, number)",
      "{(::$_typeOf_$ :answer (::$_typeConstructor_$ #Complex (::$_constructArray_$ (#number #number))))}",
    )
    testParse(
      "answer: Person({age: number, name: string})",
      "{(::$_typeOf_$ :answer (::$_typeConstructor_$ #Person (::$_constructArray_$ ((::$_typeRecord_$ (::$_constructRecord_$ ('age': #number 'name': #string)))))))}",
    )
    testParse(
      "weekend: Saturday | Sunday",
      "{(::$_typeOf_$ :weekend (::$_typeOr_$ (::$_constructArray_$ ((::$_typeConstructor_$ #Saturday (::$_constructArray_$ ())) (::$_typeConstructor_$ #Sunday (::$_constructArray_$ ()))))))}",
    )
  })
  describe("type paranthesis", () => {
    //$ is introduced to avoid paranthesis
    testParse(
      "answer: (number|string)<-opaque",
      "{(::$_typeOf_$ :answer (::$_typeModifier_opaque_$ (::$_typeOr_$ (::$_constructArray_$ (#number #string)))))}",
    )
  })
  describe("squiggle expressions in type modifiers", () => {
    testParse(
      "odds1 = [1,3,5]; odds2 = [7, 9]; type odds = number<-memberOf(concat(odds1, odds2))",
      "{:odds1 = {(::$_constructArray_$ (1 3 5))}; :odds2 = {(::$_constructArray_$ (7 9))}; (::$_typeAlias_$ #odds (::$_typeModifier_memberOf_$ #number (::concat :odds1 :odds2)))}",
    )
  })
})
