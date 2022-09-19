module Bindings = Reducer_Bindings
module Lambda = Reducer_Expression_Lambda
module Result = Belt.Result
module T = Reducer_T

type errorValue = Reducer_ErrorValue.errorValue

/*
  Recursively evaluate the expression
*/
let rec evaluate: T.reducerFn = (expression, context): (T.value, T.context) => {
  // Js.log(`reduce: ${expression->Reducer_Expression_T.toString}`)
  switch expression {
  | T.EBlock(statements) => {
      let innerContext = {...context, bindings: context.bindings->Bindings.extend}
      let (value, _) =
        statements->Belt.Array.reduce((T.IEvVoid, innerContext), ((_, currentContext), statement) =>
          statement->evaluate(currentContext)
        )
      (value, context)
    }

  | T.EProgram(statements) => {
      // Js.log(`bindings: ${context.bindings->Bindings.locals->Reducer_Namespace.toString}`)
      let (value, finalContext) =
        statements->Belt.Array.reduce((T.IEvVoid, context), ((_, currentContext), statement) =>
          statement->evaluate(currentContext)
        )

      // Js.log(`bindings after: ${finalContext.bindings->Bindings.locals->Reducer_Namespace.toString}`)
      (value, finalContext)
    }

  | T.EArray(elements) => {
      let value =
        elements
        ->Belt.Array.map(element => {
          let (value, _) = evaluate(element, context)
          value
        })
        ->T.IEvArray
      (value, context)
    }

  | T.ERecord(pairs) => {
      let value =
        pairs
        ->Belt.Array.map(((eKey, eValue)) => {
          let (key, _) = eKey->evaluate(context)
          let keyString = switch key {
          | IEvString(s) => s
          | _ => REOther("Record keys must be strings")->Reducer_ErrorValue.ErrorException->raise
          }
          let (value, _) = eValue->evaluate(context)
          (keyString, value)
        })
        ->Belt.Map.String.fromArray
        ->T.IEvRecord
      (value, context)
    }

  | T.EAssign(left, right) => {
      let (result, _) = right->evaluate(context)
      (
        T.IEvVoid,
        {
          ...context,
          bindings: context.bindings->Bindings.set(left, result),
        },
      )
    }

  | T.ESymbol(name) =>
    switch context.bindings->Bindings.get(name) {
    | Some(v) => (v, context)
    | None => Reducer_ErrorValue.RESymbolNotFound(name)->Reducer_ErrorValue.ErrorException->raise
    }

  | T.EValue(value) => (value, context)

  | T.ETernary(predicate, trueCase, falseCase) => {
      let (predicateResult, _) = predicate->evaluate(context)
      switch predicateResult {
      | T.IEvBool(value) => (value ? trueCase : falseCase)->evaluate(context)
      | _ => REExpectedType("Boolean", "")->Reducer_ErrorValue.ErrorException->raise
      }
    }

  | T.ELambda(parameters, body) => (
      Lambda.makeLambda(parameters, context.bindings, body)->T.IEvLambda,
      context,
    )

  | T.ECall(fn, args) => {
      let (lambda, _) = fn->evaluate(context)
      let argValues = Js.Array2.map(args, arg => {
        let (argValue, _) = arg->evaluate(context)
        argValue
      })
      switch lambda {
      | T.IEvLambda(lambda) => (
          Lambda.doLambdaCall(lambda, argValues, context.environment, evaluate),
          context,
        )
      | _ =>
        RENotAFunction(lambda->Reducer_Value.toString)
        ->Reducer_ErrorValue.ErrorException
        ->raise
      }
    }
  }
}

module BackCompatible = {
  // Those methods are used to support the existing tests
  // If they are used outside limited testing context, error location reporting will fail
  let parse = (peggyCode: string): result<T.expression, errorValue> =>
    peggyCode->Reducer_Peggy_Parse.parse->Result.map(Reducer_Peggy_ToExpression.fromNode)

  let evaluate = (expression: T.expression): result<T.value, errorValue> => {
    let context = Reducer_Context.createDefaultContext()
    try {
      let (value, _) = expression->evaluate(context)
      value->Ok
    } catch {
    | exn => Reducer_ErrorValue.fromException(exn)->Error
    }
  }

  let evaluateString = (peggyCode: string): result<T.value, errorValue> =>
    parse(peggyCode)->Result.flatMap(evaluate)
}
