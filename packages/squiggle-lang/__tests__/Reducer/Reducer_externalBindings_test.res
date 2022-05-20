// TODO: Reimplement with usual parse
open Jest
open Reducer_TestHelpers

describe("Eval with Bindings", () => {
  testEvalBindingsToBe("x", list{("x", ExpressionValue.EvNumber(1.))}, "Ok(1)")
  testEvalBindingsToBe("x+1", list{("x", ExpressionValue.EvNumber(1.))}, "Ok(2)")
  testParseToBe("y = x+1; y", "Ok((:$$_block_$$ (:$let :y (:$$_block_$$ (:add :x 1))) :y))")
  testEvalBindingsToBe("y = x+1; y", list{("x", ExpressionValue.EvNumber(1.))}, "Ok(2)")
  testEvalBindingsToBe("y = x+1", list{("x", ExpressionValue.EvNumber(1.))}, "Ok({x: 1,y: 2})")
})
