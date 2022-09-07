open Jest
open Reducer_Peggy_TestHelpers

describe("Peggy void", () => {
  //literal
  testToExpression("()", "{(:$_endOfOuterBlock_$ () ())}", ~v="()", ())
  testToExpression(
    "fn()=1",
    "{(:$_let_$ :fn (:$$_lambda_$$ [_] {1})); (:$_endOfOuterBlock_$ () ())}",
    // ~v="@{fn: lambda(_=>internal code)}",
    (),
  )
  testToExpression(
    "fn()=1; fn()",
    "{(:$_let_$ :fn (:$$_lambda_$$ [_] {1})); (:$_endOfOuterBlock_$ () (:fn ()))}",
    ~v="1",
    (),
  )
  testToExpression(
    "fn(a)=(); call fn(1)",
    "{(:$_let_$ :fn (:$$_lambda_$$ [a] {()})); (:$_let_$ :_ {(:fn 1)}); (:$_endOfOuterBlock_$ () ())}",
    // ~v="@{_: (),fn: lambda(a=>internal code)}",
    (),
  )
})
