module Bindings = Reducer_Bindings
module InternalExpressionValue = ReducerInterface_InternalExpressionValue

open Jest
open Reducer_Peggy_TestHelpers

describe("Peggy Outer Block", () => {
  testToExpression("1", "{(:$_endOfOuterBlock_$ () 1)}", ~v="1", ())
  testToExpression("x=1", "{(:$_let_$ :x {1}); (:$_endOfOuterBlock_$ () ())}", ~v="()", ())
  testToExpression(
    "x=1; y=2",
    "{(:$_let_$ :x {1}); (:$_let_$ :y {2}); (:$_endOfOuterBlock_$ () ())}",
    ~v="()",
    (),
  )
  testToExpression("x=1; 2", "{(:$_let_$ :x {1}); (:$_endOfOuterBlock_$ () 2)}", ~v="2", ())
  testToExpression(
    "x={a=1; a}; x",
    "{(:$_let_$ :x {(:$_let_$ :a {1}); :a}); (:$_endOfOuterBlock_$ () :x)}",
    ~v="1",
    (),
  )
})
