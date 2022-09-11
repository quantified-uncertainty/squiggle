// module Bindings = Reducer_Bindings
// module ErrorValue = Reducer_ErrorValue
// module Expression = Reducer_Expression
// module ExpressionT = Reducer_Expression_T
// module InternalExpressionValue = ReducerInterface_InternalExpressionValue
// module ProjectAccessorsT = ReducerProject_ProjectAccessors_T
// module T = Reducer_Type_T

// let ievFromTypeExpression = (
//   typeExpressionSourceCode: string,
//   reducerFn: Reducer_T.reducerFn,
// ): result<InternalExpressionValue.t, ErrorValue.t> => {
//   let sIndex = "compiled"
//   let sourceCode = `type ${sIndex}=${typeExpressionSourceCode}`
//   Reducer_Expression.BackCompatible.parse(sourceCode)->Belt.Result.flatMap(expr => {
//     let accessors = ProjectAccessorsT.identityAccessors
//     let result = reducerFn(expr, Bindings.emptyBindings, accessors)
//     let nameSpace = accessors.states.continuation

//     switch Bindings.getType(nameSpace, sIndex) {
//     | Some(value) => value->Ok
//     | None => raise(Reducer_Exception.ImpossibleException("Reducer_Type_Compile-none"))
//     }
//   })
// }

// let fromTypeExpression = (typeExpressionSourceCode: string, reducerFn: Reducer_T.reducerFn): result<
//   T.t,
//   ErrorValue.t,
// > => {
//   ievFromTypeExpression(typeExpressionSourceCode, reducerFn)->Belt.Result.map(T.fromIEvValue)
// }

// let fromTypeExpressionExn = (
//   typeExpressionSourceCode: string,
//   reducerFn: Reducer_T.reducerFn,
// ): T.t =>
//   switch fromTypeExpression(typeExpressionSourceCode, reducerFn) {
//   | Ok(value) => value
//   | _ => `Cannot compile ${typeExpressionSourceCode}`->Reducer_Exception.ImpossibleException->raise
//   }
