import * as expression from "../expression";
import { AST } from "./parse";

const contentFromNode = (ast: AST): expression.ExpressionContent => {
  switch (ast.type) {
    case "Block":
      return expression.eBlock(ast.statements.map(fromNode));
    case "Program":
      return expression.eProgram(ast.statements.map(fromNode));
    case "Array":
      return expression.eArray(ast.elements.map(fromNode));
    case "Record":
      return expression.eRecord(
        ast.elements.map((kv) => [fromNode(kv.key), fromNode(kv.value)])
      );
    case "Boolean":
      return expression.eBool(ast.value);
    case "Call":
      return expression.eCall(fromNode(ast.fn), ast.args.map(fromNode));
    case "Float":
      return expression.eNumber(ast.value);
    case "Identifier":
      return expression.eSymbol(ast.value);
    case "Integer":
      return expression.eNumber(ast.value);
    case "KeyValue":
      return expression.eArray([fromNode(ast.key), fromNode(ast.value)]);
    case "Lambda":
      return expression.eLambda(
        ast.args.map((arg) => {
          if (arg.type !== "Identifier") {
            throw new Error("Expected identifier node");
          }
          return arg.value;
        }),
        fromNode(ast.body),
        ast.name
      );
    case "LetStatement":
      return expression.eLetStatement(ast.variable.value, fromNode(ast.value));
    case "ModuleIdentifier":
      return expression.eIdentifier(ast.value);
    case "String":
      return expression.eString(ast.value);
    case "Ternary":
      return expression.eTernary(
        fromNode(ast.condition),
        fromNode(ast.trueExpression),
        fromNode(ast.falseExpression)
      );
    case "Void":
      return expression.eVoid();
    default:
      throw new Error(`Unsupported AST value ${ast}`);
  }
};

const fromNode = (ast: AST): expression.Expression => {
  return {
    ast,
    ...contentFromNode(ast),
  };
};

export const expressionFromAst = fromNode;
