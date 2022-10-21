module Bindings = Reducer_Bindings
module Result = Belt.Result
module T = Reducer_T

let toLocation = (expression: T.expression): Reducer_Peggy_Parse.location => {
  expression.ast.location
}

let throwFrom = (error: SqError.Message.t, expression: T.expression, context: T.context) =>
  error->SqError.throwMessageWithFrameStack(
    context.frameStack->Reducer_FrameStack.extend(
      context->Reducer_Context.currentFunctionName,
      Some(expression->toLocation),
    ),
  )

/*
  Recursively evaluate the expression
*/
let rec evaluate: T.reducerFn = (expression, context): (T.value, T.context) => {
  // Js.log(`reduce: ${expression->Reducer_Expression_T.toString}`)
  switch expression.content {
  | T.EBlock(statements) => {
      let innerContext = {...context, bindings: context.bindings->Bindings.extend}
      let (value, _) =
        statements->E.A.reduce((T.IEvVoid, innerContext), ((_, currentContext), statement) =>
          statement->evaluate(currentContext)
        )
      (value, context)
    }

  | T.EProgram(statements) => {
      // Js.log(`bindings: ${context.bindings->Bindings.locals->Reducer_Namespace.toString}`)
      let (value, finalContext) =
        statements->E.A.reduce((T.IEvVoid, context), ((_, currentContext), statement) =>
          statement->evaluate(currentContext)
        )

      // Js.log(`bindings after: ${finalContext.bindings->Bindings.locals->Reducer_Namespace.toString}`)
      (value, finalContext)
    }

  | T.EArray(elements) => {
      let value =
        elements
        ->E.A.fmap(element => {
          let (value, _) = evaluate(element, context)
          value
        })
        ->T.IEvArray
      (value, context)
    }

  | T.ERecord(pairs) => {
      let value =
        pairs
        ->E.A.fmap(((eKey, eValue)) => {
          let (key, _) = eKey->evaluate(context)
          let keyString = switch key {
          | IEvString(s) => s
          | _ => REOther("Record keys must be strings")->throwFrom(expression, context)
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
    | None => RESymbolNotFound(name)->throwFrom(expression, context)
    }

  | T.EValue(value) => (value, context)

  | T.ETernary(predicate, trueCase, falseCase) => {
      let (predicateResult, _) = predicate->evaluate(context)
      switch predicateResult {
      | T.IEvBool(value) => (value ? trueCase : falseCase)->evaluate(context)
      | _ => REExpectedType("Boolean", "")->throwFrom(expression, context)
      }
    }

  | T.ELambda(parameters, body, name) => (
      Reducer_Lambda.makeLambda(
        name,
        parameters,
        context.bindings,
        body,
        expression->toLocation,
      )->T.IEvLambda,
      context,
    )

  | T.ECall(fn, args) => {
      let (lambda, _) = fn->evaluate(context)
      let argValues = E.A.fmap(args, arg => {
        let (argValue, _) = arg->evaluate(context)
        argValue
      })
      switch lambda {
      | T.IEvLambda(lambda) => {
          let result = Reducer_Lambda.doLambdaCallFrom(
            lambda,
            argValues,
            context,
            evaluate,
            Some(expression->toLocation), // we have to pass the location of a current expression here, to put it on frameStack
          )
          (result, context)
        }

      | _ => RENotAFunction(lambda->Reducer_Value.toString)->throwFrom(expression, context)
      }
    }
  }
}

module BackCompatible = {
  // Those methods are used to support the existing tests
  // If they are used outside limited testing context, error location reporting will fail
  let parse = (peggyCode: string): result<T.expression, Reducer_Peggy_Parse.parseError> =>
    peggyCode->Reducer_Peggy_Parse.parse("main")->Result.map(Reducer_Peggy_ToExpression.fromNode)

  let createDefaultContext = () =>
    Reducer_Context.createContext(SquiggleLibrary_StdLib.stdLib, Reducer_Context.defaultEnvironment)

  let evaluate = (expression: T.expression): result<T.value, SqError.t> => {
    let context = createDefaultContext()
    try {
      let (value, _) = expression->evaluate(context)
      value->Ok
    } catch {
    | exn => exn->SqError.fromException->Error
    }
  }

  let evaluateString = (peggyCode: string): result<T.value, SqError.t> =>
    parse(peggyCode)->E.R.errMap(e => e->SqError.fromParseError)->Result.flatMap(evaluate)
}
