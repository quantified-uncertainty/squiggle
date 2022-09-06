open Jest
open Reducer_Peggy_TestHelpers

describe("Construct Array", () => {
  testToExpression("[1,2]", "{(:$_endOfOuterBlock_$ () (:$_constructArray_$ 1 2))}", ~v="[1,2]", ())
  testToExpression("[]", "{(:$_endOfOuterBlock_$ () (:$_constructArray_$))}", ~v="[]", ())
  testToExpression(
    "f(x)=x; g(x)=x; [f, g]",
    "{(:$_let_$ :f (:$$_lambda_$$ [x] {:x})); (:$_let_$ :g (:$$_lambda_$$ [x] {:x})); (:$_endOfOuterBlock_$ () (:$_constructArray_$ :f :g))}",
    ~v="[lambda(x=>internal code),lambda(x=>internal code)]",
    (),
  )
})
