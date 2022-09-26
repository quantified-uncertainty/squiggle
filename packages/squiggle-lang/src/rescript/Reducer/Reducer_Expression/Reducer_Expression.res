module Bindings = Reducer_Bindings
module Lambda = Reducer_Expression_Lambda
module Result = Belt.Result
module T = Reducer_T

let toLocation = (expression: T.expression): SqError.location => {
  expression.ast.location
}

let throwFrom = (error: SqError.Message.t, expression: T.expression) =>
  error->SqError.fromMessageWithLocation(expression->toLocation)->SqError.throw

/*
  Recursively evaluate the expression
*/
let rec evaluate: T.reducerFn = (expression, context): (T.value, T.context) => {
  // Js.log(`reduce: ${expression->Reducer_Expression_T.toString}`)
  switch expression.content {
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
          | _ => REOther("Record keys must be strings")->throwFrom(expression)
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
    | None => RESymbolNotFound(name)->throwFrom(expression)
    }

  | T.EValue(value) => (value, context)

  | T.ETernary(predicate, trueCase, falseCase) => {
      let (predicateResult, _) = predicate->evaluate(context)
      switch predicateResult {
      | T.IEvBool(value) => (value ? trueCase : falseCase)->evaluate(context)
      | _ => REExpectedType("Boolean", "")->throwFrom(expression)
      }
    }

  | T.ELambda(parameters, body) => (
      Lambda.makeLambda(parameters, context.bindings, body)->T.IEvLambda,
      context,
    )

  | T.ECall(fn, args) => {
      let (lambda, _) = fn->evaluate(context)
      let argValues = Belt.Array.map(args, arg => {
        let (argValue, _) = arg->evaluate(context)
        argValue
      })
      switch lambda {
      | T.IEvLambda(lambda) =>
        try {
          let result = Lambda.doLambdaCall(lambda, argValues, context.environment, evaluate)
          (result, context)
        } catch {
        | exn => exn->SqError.fromException->SqError.extend(expression->toLocation)->SqError.throw
        }
      | _ => RENotAFunction(lambda->Reducer_Value.toString)->throwFrom(expression)
      }
    }
  }
}

module BackCompatible = {
  // Those methods are used to support the existing tests
  // If they are used outside limited testing context, error location reporting will fail
  let parse = (peggyCode: string): result<T.expression, Reducer_Peggy_Parse.parseError> =>
    peggyCode->Reducer_Peggy_Parse.parse("main")->Result.map(Reducer_Peggy_ToExpression.fromNode)

  let evaluate = (expression: T.expression): result<T.value, SqError.t> => {
    let context = Reducer_Context.createDefaultContext()
    try {
      let (value, _) = expression->evaluate(context)
      value->Ok
    } catch {
    | exn => exn->SqError.fromException->Error
    }
  }

  let evaluateString = (peggyCode: string): result<T.value, SqError.t> =>
    parse(peggyCode)
    ->E.R2.errMap(e => e->SqError.Message.fromParseError->SqError.fromMessage)
    ->Result.flatMap(evaluate)
}
