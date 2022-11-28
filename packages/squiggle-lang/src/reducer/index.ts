import * as Bindings from "./bindings";
import {
  ReducerFn,
  vArray,
  vLambda,
  vRecord,
  vVoid,
  valueToString,
  Value,
} from "../value";
import { Expression } from "../expression";
import * as FrameStack from "./FrameStack";
import * as Context from "./Context";
import * as Lambda from "./Lambda";
import * as IError from "./IError";
import { ImmutableMap } from "../utility/immutableMap";
import { Ok, result } from "../utility/result";
import * as Result from "../utility/result";
import { stdLib } from "../library";
import { defaultEnv } from "../Dist/env";
import { parse } from "../ast/parse";
import { expressionFromAst } from "../ast/toExpression";

const throwFrom = (
  error: IError.Message,
  expression: Expression,
  context: Context.ReducerContext
): never => {
  return IError.throwMessageWithFrameStack(
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
                IError.REOther("Record keys must be strings"),
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
          IError.RESymbolNotFound(expression.value),
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
          IError.REExpectedType("Boolean", ""),
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
            IError.RENotAFunction(valueToString(lambda)),
            expression,
            context
          );
      }
    }
    default:
      throw new Error("Unreachable");
  }
};

const createDefaultContext = () => Context.createContext(stdLib, defaultEnv);

export const evaluateExpressionToResult = (
  expression: Expression
): result<Value, IError.IError> => {
  const context = createDefaultContext();
  try {
    const [value] = evaluate(expression, context);
    return Ok(value);
  } catch (e) {
    return Result.Error(IError.errorFromException(e));
  }
};

export const evaluateStringToResult = (
  code: string
): result<Value, IError.IError> => {
  const exprR = Result.fmap(parse(code, "main"), expressionFromAst);

  return Result.bind(
    Result.errMap(exprR, IError.fromParseError),
    evaluateExpressionToResult
  );
};
