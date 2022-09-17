module Bindings = Reducer_Bindings
module InternalExpressionValue = ReducerInterface_InternalExpressionValue

open Jest
open Reducer_Peggy_TestHelpers

describe("Peggy Outer Block", () => {
  testToExpression("1", "1", ~v="1", ())
  testToExpression("x=1", "x = {1}", ~v="()", ())
  testToExpression(
    "x=1; y=2",
    "x = {1}; y = {2}",
    ~v="()",
    (),
  )
  testToExpression("x=1; 2", "x = {1}; 2", ~v="2", ())
  testToExpression(
    "x={a=1; a}; x",
    "x = {a = {1}; a}; x",
    ~v="1",
    (),
  )
})
