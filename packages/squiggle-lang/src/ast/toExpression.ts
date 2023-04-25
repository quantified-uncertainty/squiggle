import * as expression from "../expression/index.js";
import { ASTNode } from "./parse.js";
import { infixFunctions, unaryFunctions } from "./peggyHelpers.js";

export const INDEX_LOOKUP_FUNCTION = "$_atIndex_$";

const contentFromNode = (ast: ASTNode): expression.ExpressionContent => {
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
    case "InfixCall":
      return expression.eCall(
        { ast, ...expression.eSymbol(infixFunctions[ast.op]) },
        ast.args.map(fromNode)
      );
    case "UnaryCall":
      return expression.eCall(
        { ast, ...expression.eSymbol(unaryFunctions[ast.op]) },
        [fromNode(ast.arg)]
      );
    case "DotLookup":
      return expression.eCall(
        { ast, ...expression.eSymbol(INDEX_LOOKUP_FUNCTION) },
        [fromNode(ast.arg), { ast, ...expression.eString(ast.key) }]
      );
    case "BracketLookup":
      return expression.eCall(
        { ast, ...expression.eSymbol(INDEX_LOOKUP_FUNCTION) },
        [fromNode(ast.arg), fromNode(ast.key)]
      );
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
      throw new Error(`Unsupported AST value ${ast satisfies never}`);
  }
};

const fromNode = (ast: ASTNode): expression.Expression => {
  return {
    ast,
    ...contentFromNode(ast),
  };
};

export const expressionFromAst = fromNode;
