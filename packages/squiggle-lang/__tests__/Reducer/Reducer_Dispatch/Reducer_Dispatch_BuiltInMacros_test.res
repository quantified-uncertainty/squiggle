// open Jest
// // open Expect

// open Reducer_Expression_ExpressionBuilder
// open Reducer_TestMacroHelpers
// module ExpressionT = Reducer_Expression_T

// let exampleExpression = eNumber(1.)
// let exampleExpressionY = eSymbol("y")
// let exampleStatementY = eLetStatement("y", eNumber(1.))
// let exampleStatementX = eLetStatement("y", eSymbol("x"))
// let exampleStatementZ = eLetStatement("z", eSymbol("y"))

// // If it is not a macro then it is not expanded
// testMacro([], exampleExpression, "Ok(1)")

// describe("bindStatement", () => {
//   // A statement is bound by the bindings created by the previous statement
//   testMacro(
//     [],
//     eBindStatement(eBindings([]), exampleStatementY),
//     "Ok((:$_setBindings_$ @{} :y 1) context: @{})",
//   )
//   // Then it answers the bindings for the next statement when reduced
//   testMacroEval([], eBindStatement(eBindings([]), exampleStatementY), "Ok(@{y: 1})")
//   // Now let's feed a binding to see what happens
//   testMacro(
//     [],
//     eBindStatement(eBindings([("x", IEvNumber(2.))]), exampleStatementX),
//     "Ok((:$_setBindings_$ @{x: 2} :y 2) context: @{x: 2})",
//   )
//   // An expression does not return a binding, thus error
//   testMacro([], eBindStatement(eBindings([]), exampleExpression), "Assignment expected")
//   // When bindings from previous statement are missing the context is injected. This must be the first statement of a block
//   testMacro(
//     [("z", IEvNumber(99.))],
//     eBindStatementDefault(exampleStatementY),
//     "Ok((:$_setBindings_$ @{z: 99} :y 1) context: @{z: 99})",
//   )
// })

// describe("bindExpression", () => {
//   // x is simply bound in the expression
//   testMacro(
//     [],
//     eBindExpression(eBindings([("x", IEvNumber(2.))]), eSymbol("x")),
//     "Ok(2 context: @{x: 2})",
//   )
//   // When an let statement is the end expression then bindings are returned
//   testMacro(
//     [],
//     eBindExpression(eBindings([("x", IEvNumber(2.))]), exampleStatementY),
//     "Ok((:$_exportBindings_$ (:$_setBindings_$ @{x: 2} :y 1)) context: @{x: 2})",
//   )
//   // Now let's reduce that expression
//   testMacroEval(
//     [],
//     eBindExpression(eBindings([("x", IEvNumber(2.))]), exampleStatementY),
//     "Ok(@{x: 2,y: 1})",
//   )
//   // When bindings are missing the context is injected. This must be the first and last statement of a block
//   testMacroEval(
//     [("z", IEvNumber(99.))],
//     eBindExpressionDefault(exampleStatementY),
//     "Ok(@{y: 1,z: 99})",
//   )
// })

// describe("block", () => {
//   // Block with a single expression
//   testMacro([], eBlock(list{exampleExpression}), "Ok((:$$_bindExpression_$$ 1))")
//   testMacroEval([], eBlock(list{exampleExpression}), "Ok(1)")
//   // Block with a single statement
//   testMacro([], eBlock(list{exampleStatementY}), "Ok((:$$_bindExpression_$$ (:$_let_$ :y 1)))")
//   testMacroEval([], eBlock(list{exampleStatementY}), "Ok(@{y: 1})")
//   // Block with a statement and an expression
//   testMacro(
//     [],
//     eBlock(list{exampleStatementY, exampleExpressionY}),
//     "Ok((:$$_bindExpression_$$ (:$$_bindStatement_$$ (:$_let_$ :y 1)) :y))",
//   )
//   testMacroEval([], eBlock(list{exampleStatementY, exampleExpressionY}), "Ok(1)")
//   // Block with a statement and another statement
//   testMacro(
//     [],
//     eBlock(list{exampleStatementY, exampleStatementZ}),
//     "Ok((:$$_bindExpression_$$ (:$$_bindStatement_$$ (:$_let_$ :y 1)) (:$_let_$ :z :y)))",
//   )
//   testMacroEval([], eBlock(list{exampleStatementY, exampleStatementZ}), "Ok(@{y: 1,z: 1})")
//   // Block inside a block
//   testMacro([], eBlock(list{eBlock(list{exampleExpression})}), "Ok((:$$_bindExpression_$$ {1}))")
//   testMacroEval([], eBlock(list{eBlock(list{exampleExpression})}), "Ok(1)")
//   // Block assigned to a variable
//   testMacro(
//     [],
//     eBlock(list{eLetStatement("z", eBlock(list{eBlock(list{exampleExpressionY})}))}),
//     "Ok((:$$_bindExpression_$$ (:$_let_$ :z {{:y}})))",
//   )
//   testMacroEval(
//     [],
//     eBlock(list{eLetStatement("z", eBlock(list{eBlock(list{exampleExpressionY})}))}),
//     "Ok(@{z: :y})",
//   )
//   // Empty block
//   testMacro([], eBlock(list{}), "Ok(:undefined block)") //TODO: should be an error
//   //   :$$_block_$$ (:$$_block_$$ (:$_let_$ :y (:add :x 1)) :y)"
//   testMacro(
//     [],
//     eBlock(list{
//       eBlock(list{
//         eLetStatement("y", eFunction("add", list{eSymbol("x"), eNumber(1.)})),
//         eSymbol("y"),
//       }),
//     }),
//     "Ok((:$$_bindExpression_$$ {(:$_let_$ :y (:add :x 1)); :y}))",
//   )
//   testMacroEval(
//     [("x", IEvNumber(1.))],
//     eBlock(list{
//       eBlock(list{
//         eLetStatement("y", eFunction("add", list{eSymbol("x"), eNumber(1.)})),
//         eSymbol("y"),
//       }),
//     }),
//     "Ok(2)",
//   )
// })

// describe("lambda", () => {
//   // assign a lambda to a variable
//   let lambdaExpression = eFunction("$$_lambda_$$", list{eArrayString(["y"]), exampleExpressionY})
//   testMacro([], lambdaExpression, "Ok(lambda(y=>internal code))")
//   // call a lambda
//   let callLambdaExpression = list{lambdaExpression, eNumber(1.)}->ExpressionT.EList
//   testMacro([], callLambdaExpression, "Ok(((:$$_lambda_$$ [y] :y) 1))")
//   testMacroEval([], callLambdaExpression, "Ok(1)")
//   // Parameters shadow the outer scope
//   testMacroEval([("y", IEvNumber(666.))], callLambdaExpression, "Ok(1)")
//   // When not shadowed by the parameters, the outer scope variables are available
//   let lambdaExpression = eFunction(
//     "$$_lambda_$$",
//     list{eArrayString(["z"]), eFunction("add", list{eSymbol("y"), eSymbol("z")})},
//   )
//   let callLambdaExpression = eList(list{lambdaExpression, eNumber(1.)})
//   testMacroEval([("y", IEvNumber(666.))], callLambdaExpression, "Ok(667)")
// })
