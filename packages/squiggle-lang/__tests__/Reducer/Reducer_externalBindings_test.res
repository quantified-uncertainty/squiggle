open Jest
open Reducer_TestHelpers

Skip.describe("Parse for Bindings", () => {
  testParseOuterToBe(
    "x",
    "????",
    ) 
  testParseOuterToBe(
    "x+1",
    "????",
    ) 
  testParseOuterToBe(
    "y = x+1; y",
    "????",
    ) 
  testParsePartialToBe(
    "x",
    "????",
    ) 
  testParsePartialToBe(
    "y=x",
    "????",
    ) 
  testParsePartialToBe(
    "y=x+1",
    "????",
    ) 
  testParsePartialToBe(
    "y = x+1; z = y",
    "????",
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

