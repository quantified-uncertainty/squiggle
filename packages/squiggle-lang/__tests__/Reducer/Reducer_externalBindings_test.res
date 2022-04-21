open Jest
open Reducer_TestHelpers

Only.describe("Parse for Bindings", () => {
  testParseOuterToBe(
    "x",
    "Ok((:$$bindExpression (:$$bindings) :x))",
    ) 
  testParseOuterToBe(
    "x+1",
    "Ok((:$$bindExpression (:$$bindings) (:add :x 1)))",
    ) 
  testParseOuterToBe(
    "y = x+1; y",
    "Ok((:$$bindExpression (:$$bindStatement (:$$bindings) (:$let :y (:add :x 1))) :y))",
    ) 
  testParsePartialToBe(
    "x",
    "Ok((:$$bindExpression (:$$bindStatement (:$$bindings) :x) (:$exportVariablesExpression)))",
    ) 
  testParsePartialToBe(
    "y=x",
    "Ok((:$$bindExpression (:$$bindStatement (:$$bindings) (:$let :y :x)) (:$exportVariablesExpression)))",
    ) 
  testParsePartialToBe(
    "y=x+1",
    "Ok((:$$bindExpression (:$$bindStatement (:$$bindings) (:$let :y (:add :x 1))) (:$exportVariablesExpression)))",
    ) 
  testParsePartialToBe(
    "y = x+1; z = y",
    "Ok((:$$bindExpression (:$$bindStatement (:$$bindStatement (:$$bindings) (:$let :y (:add :x 1))) (:$let :z :y)) (:$exportVariablesExpression)))",
    ) 
})

Skip.describe("Eval for Bindings", () => {
  testEvalBindingsToBe(
    "x",
    list{("x", ExpressionValue.EvNumber(1.))},
    "????",
    ) 
  testEvalBindingsToBe(
    "x+1",
    list{("x", ExpressionValue.EvNumber(1.))},
    "????",
    ) 
  testEvalBindingsToBe(
    "y = x+1; y",
    list{("x", ExpressionValue.EvNumber(1.))},
    "????",
    ) 
  testEvalPartialBindingsToBe(
    "x",
    list{("x", ExpressionValue.EvNumber(1.))},
    "????",
    ) 
  testEvalPartialBindingsToBe(
    "y=x",
    list{("x", ExpressionValue.EvNumber(1.))},
    "????",
    ) 
  testEvalBindingsToBe(
    "y=x+1",
    list{("x", ExpressionValue.EvNumber(1.))},
    "????",
    ) 
  testEvalBindingsToBe(
    "y = x+1; z = y",
    list{("x", ExpressionValue.EvNumber(1.))},
    "????",
    ) 
})

