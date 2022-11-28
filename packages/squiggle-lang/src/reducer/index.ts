import * as Bindings from "./bindings";
import {
  ReducerFn,
  vArray,
  vLambda,
  vRecord,
  vVoid,
  valueToString,
} from "../value";
import { Expression } from "../expression";
import * as FrameStack from "./FrameStack";
import * as Context from "./Context";
import * as Lambda from "./Lambda";
import * as SqError from "./IError";
import { ImmutableMap } from "../utility/immutableMap";

const throwFrom = (
  error: SqError.Message,
  expression: Expression,
  context: Context.ReducerContext
): never => {
  return SqError.throwMessageWithFrameStack(
    error,
    FrameStack.extend(
      context.frameStack,
      Context.currentFunctionName(context),
      expression.ast.location
    )
  );
};

/*
  Recursively evaluate the expression
*/
export const evaluate: ReducerFn = (expression, context) => {
  // console.log(`reduce: ${expression->Reducer_Expression_T.toString}`)
  switch (expression.type) {
    case "Block": {
      let currentContext: Context.ReducerContext = {
        ...context,
        bindings: Bindings.extend(context.bindings),
      };
      let currentValue = vVoid();
      for (const statement of expression.value) {
        [currentValue, currentContext] = evaluate(statement, currentContext);
      }
      return [currentValue, context]; // throw away block's context
    }

    case "Program": {
      // Js.log(`bindings: ${context.bindings->Bindings.locals->Reducer_Namespace.toString}`)
      let currentContext = context;
      let currentValue = vVoid();
      for (const statement of expression.value) {
        [currentValue, currentContext] = evaluate(statement, currentContext);
      }
      // Js.log(`bindings after: ${finalContext.bindings->Bindings.locals->Reducer_Namespace.toString}`)
      return [currentValue, currentContext];
    }

    case "Array": {
      const values = expression.value.map((element) => {
        const [value] = evaluate(element, context);
        return value;
      });
      return [vArray(values), context];
    }

    case "Record": {
      const value = vRecord(
        ImmutableMap.fromArray(
          expression.value.map(([eKey, eValue]) => {
            const [key] = evaluate(eKey, context);
            if (key.type !== "String") {
              return throwFrom(
                SqError.REOther("Record keys must be strings"),
                expression,
                context
              );
            }
            const keyString: string = key.value;
            const [value] = evaluate(eValue, context);
            return [keyString, value];
          })
        )
      );
      return [value, context];
    }

    case "Assign": {
      const [result] = evaluate(expression.right, context);
      return [
        vVoid(),
        {
          ...context,
          bindings: Bindings.set(context.bindings, expression.left, result),
        },
      ];
    }

    case "Symbol": {
      const name = expression.value;
      const value = Bindings.get(context.bindings, name);
      if (value === undefined) {
        return throwFrom(
          SqError.RESymbolNotFound(expression.value),
          expression,
          context
        );
      } else {
        return [value, context];
      }
    }

    case "Value":
      return [expression.value, context];

    case "Ternary": {
      const [predicateResult] = evaluate(expression.condition, context);
      if (predicateResult.type === "Bool") {
        return evaluate(
          predicateResult.value ? expression.ifTrue : expression.ifFalse,
          context
        );
      } else {
        return throwFrom(
          SqError.REExpectedType("Boolean", ""),
          expression,
          context
        );
      }
    }

    case "Lambda": {
      return [
        vLambda(
          Lambda.makeLambda(
            expression.name,
            expression.parameters,
            context.bindings,
            expression.body,
            expression.ast.location
          )
        ),
        context,
      ];
    }

    case "Call": {
      const [lambda] = evaluate(expression.fn, context);
      const argValues = expression.args.map((arg) => {
        const [argValue] = evaluate(arg, context);
        return argValue;
      });
      switch (lambda.type) {
        case "Lambda":
          const result = Lambda.doLambdaCallFrom(
            lambda.value,
            argValues,
            context,
            evaluate,
            expression.ast.location // we have to pass the location of a current expression here, to put it on frameStack
          );
          return [result, context];
        default:
          return throwFrom(
            SqError.RENotAFunction(valueToString(lambda)),
            expression,
            context
          );
      }
    }
    default:
      throw new Error("Unreachable");
  }
};
