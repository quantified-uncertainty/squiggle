module CTV = Reducer.Extension.CodeTreeValue
module ME = Reducer.MathJs.Eval
module Rerr = Reducer.Error

open Jest
open ExpectJs

describe("eval", () => {
    test("Number", () => expect(ME.eval("1"))
    -> toEqual(Ok(CTV.CtvNumber(1.))))
    test("Number expr", () => expect(ME.eval("1-1"))
    -> toEqual(Ok(CTV.CtvNumber(0.))))
    test("String", () => expect(ME.eval("'hello'"))
    -> toEqual(Ok(CTV.CtvString("hello"))))
    test("String expr", () => expect(ME.eval("concat('hello ','world')"))
    -> toEqual(Ok(CTV.CtvString("hello world"))))
    test("Boolean", () => expect(ME.eval("true"))
    -> toEqual(Ok(CTV.CtvBool(true))))
    test("Boolean expr", () => expect(ME.eval("2>1"))
    -> toEqual(Ok(CTV.CtvBool(true))))
})

describe("errors", () => {
  // All those errors propagete up and are returned by the resolver
  test("unknown function", () => expect(ME.eval("testZadanga()"))
  -> toEqual(Error(Rerr.RerrJs(Some("Undefined function testZadanga"), Some("Error")))))

  test("unknown answer type", () => expect(ME.eval("1+1i"))
  -> toEqual(Error(Rerr.RerrTodo("Unhandled MathJs literal type: object"))))
})
