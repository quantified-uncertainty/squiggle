import * as expression from "./index.js";
import { ASTNode } from "../ast/parse.js";
import { infixFunctions, unaryFunctions } from "../ast/peggyHelpers.js";
import { INDEX_LOOKUP_FUNCTION } from "./constants.js";

function contentFromNode(ast: ASTNode): expression.ExpressionContent {
  switch (ast.type) {
    case "Block":
      return expression.eBlock(ast.statements.map(expressionFromAst));
    case "Program":
      return expression.eProgram(ast.statements.map(expressionFromAst));
    case "Array":
      return expression.eArray(ast.elements.map(expressionFromAst));
    case "Record":
      return expression.eRecord(
        ast.elements.map((kv) => [
          expressionFromAst(kv.key),
          expressionFromAst(kv.value),
        ])
      );
    case "Boolean":
      return expression.eBool(ast.value);
    case "Call":
      return expression.eCall(
        expressionFromAst(ast.fn),
        ast.args.map(expressionFromAst)
      );
    case "InfixCall":
      return expression.eCall(
        { ast, ...expression.eSymbol(infixFunctions[ast.op]) },
        ast.args.map(expressionFromAst)
      );
    case "UnaryCall":
      return expression.eCall(
        { ast, ...expression.eSymbol(unaryFunctions[ast.op]) },
        [expressionFromAst(ast.arg)]
      );
    case "Pipe":
      return expression.eCall(expressionFromAst(ast.fn), [
        expressionFromAst(ast.leftArg),
        ...ast.rightArgs.map(expressionFromAst),
      ]);
    case "DotLookup":
      return expression.eCall(
        { ast, ...expression.eSymbol(INDEX_LOOKUP_FUNCTION) },
        [expressionFromAst(ast.arg), { ast, ...expression.eString(ast.key) }]
      );
    case "BracketLookup":
      return expression.eCall(
        { ast, ...expression.eSymbol(INDEX_LOOKUP_FUNCTION) },
        [expressionFromAst(ast.arg), expressionFromAst(ast.key)]
      );
    case "Float":
      return expression.eNumber(ast.value);
    case "Identifier":
      return expression.eSymbol(ast.value);
    case "Integer":
      return expression.eNumber(ast.value);
    case "KeyValue":
      return expression.eArray([
        expressionFromAst(ast.key),
        expressionFromAst(ast.value),
      ]);
    case "Lambda":
      return expression.eLambda(
        ast.args.map((arg) => {
          if (arg.type !== "Identifier") {
            throw new Error("Expected identifier node");
          }
          return arg.value;
        }),
        expressionFromAst(ast.body),
        ast.name
      );
    case "LetStatement":
      return expression.eLetStatement(
        ast.variable.value,
        expressionFromAst(ast.value)
      );
    case "DefunStatement":
      return expression.eLetStatement(
        ast.variable.value,
        expressionFromAst(ast.value)
      );
    case "ModuleIdentifier":
      return expression.eIdentifier(ast.value);
    case "String":
      return expression.eString(ast.value);
    case "Ternary":
      return expression.eTernary(
        expressionFromAst(ast.condition),
        expressionFromAst(ast.trueExpression),
        expressionFromAst(ast.falseExpression)
      );
    case "Void":
      return expression.eVoid();
    default:
      throw new Error(`Unsupported AST value ${ast satisfies never}`);
  }
}

export function expressionFromAst(ast: ASTNode): expression.Expression {
  return {
    ast,
    ...contentFromNode(ast),
  };
}
