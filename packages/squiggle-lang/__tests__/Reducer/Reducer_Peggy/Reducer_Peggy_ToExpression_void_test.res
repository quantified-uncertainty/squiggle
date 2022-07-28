open Jest
open Reducer_Peggy_TestHelpers

describe("Peggy void", () => {
  //literal
  testToExpression("()", "{()}", ~v="()", ())
  testToExpression(
    "fn()=1",
    "{(:$_let_$ :fn (:$$_lambda_$$ [_] {1}))}",
    ~v="@{fn: lambda(_=>internal code)}",
    (),
  )
  testToExpression("fn()=1; fn()", "{(:$_let_$ :fn (:$$_lambda_$$ [_] {1})); (:fn ())}", ~v="1", ())
  testToExpression(
    "fn(a)=(); call fn(1)",
    "{(:$_let_$ :fn (:$$_lambda_$$ [a] {()})); (:$_let_$ :_ {(:fn 1)})}",
    ~v="@{_: (),fn: lambda(a=>internal code)}",
    (),
  )
})
