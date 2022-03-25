module CT = Reducer.CodeTree
module CTV = Reducer.Extension.CodeTreeValue

open Jest
open Expect

let expectParseToBe = (expr: string, answer: string) =>
  Reducer.parse(expr) -> CT.showResult -> expect -> toBe(answer)

let expectEvalToBe = (expr: string, answer: string) =>
  Reducer.eval(expr) -> CTV.showResult -> expect -> toBe(answer)

// Current configuration does not ignore this file so we have to have a test
test("test helpers", () => expect(1)->toBe(1))
