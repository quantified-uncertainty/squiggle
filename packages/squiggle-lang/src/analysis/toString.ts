import { SExpr, SExprPrintOptions, sExprToString } from "../utility/sExpr.js";
import { TypedASTNode } from "./types.js";

// This function is similar to `nodeToString` for raw AST, but takes a TypedASTNode.
export function nodeToString(
  node: TypedASTNode,
  printOptions: SExprPrintOptions = {}
): string {
  const toSExpr = (node: TypedASTNode): SExpr => {
    const sExpr = (components: (SExpr | null | undefined)[]): SExpr => ({
      name: node.kind,
      args: components,
    });

    switch (node.kind) {
      case "Program":
        return sExpr([
          // TODO - imports
          ...node.statements.map(toSExpr),
          node.result ? toSExpr(node.result) : undefined,
        ]);
      case "Import":
        return sExpr([toSExpr(node.path), toSExpr(node.variable)]);
      case "Block":
        return sExpr([...node.statements.map(toSExpr), toSExpr(node.result)]);
      case "Array":
        return sExpr(node.elements.map(toSExpr));
      case "Dict":
        return sExpr(node.elements.map(toSExpr));
      case "Boolean":
        return String(node.value);
      case "Call":
        return sExpr([node.fn, ...node.args].map(toSExpr));
      case "InfixCall":
        return sExpr([node.op, ...node.args.map(toSExpr)]);
      case "Pipe":
        return sExpr([node.leftArg, node.fn, ...node.rightArgs].map(toSExpr));
      case "DotLookup":
        return sExpr([toSExpr(node.arg), node.key]);
      case "BracketLookup":
        return sExpr([node.arg, node.key].map(toSExpr));
      case "UnaryCall":
        return sExpr([node.op, toSExpr(node.arg)]);
      case "Float":
        // see also: "Float" branch in compiler/compile.ts
        return `${node.integer}${
          node.fractional === null ? "" : `.${node.fractional}`
        }${node.exponent === null ? "" : `e${node.exponent}`}`;
      case "Identifier":
      case "IdentifierDefinition":
        return `:${node.value}`;
      case "LambdaParameter":
        if (!node.annotation && !node.unitTypeSignature) {
          return `:${node.variable.value}`;
        }
        return sExpr([
          node.variable.value,
          node.annotation && toSExpr(node.annotation),
          node.unitTypeSignature && toSExpr(node.unitTypeSignature),
        ]);
      case "KeyValue":
        return sExpr([node.key, node.value].map(toSExpr));
      case "Lambda":
        return sExpr([
          ...node.args.map(toSExpr),
          toSExpr(node.body),
          node.returnUnitType ? toSExpr(node.returnUnitType) : undefined,
        ]);
      case "Decorator":
        return sExpr([node.name, ...node.args].map(toSExpr));
      case "LetStatement":
        return sExpr([
          toSExpr(node.variable),
          node.unitTypeSignature ? toSExpr(node.unitTypeSignature) : undefined,
          toSExpr(node.value),
          node.exported ? "exported" : undefined,
          ...node.decorators.map(toSExpr),
        ]);
      case "DefunStatement":
        return sExpr([
          toSExpr(node.variable),
          toSExpr(node.value),
          node.exported ? "exported" : undefined,
          ...node.decorators.map(toSExpr),
        ]);
      case "String":
        return `'${node.value}'`; // TODO - quote?
      case "Ternary":
        return sExpr(
          [node.condition, node.trueExpression, node.falseExpression].map(
            toSExpr
          )
        );
      case "UnitTypeSignature":
        return sExpr([toSExpr(node.body)]);
      case "InfixUnitType":
        return sExpr([node.op, ...node.args.map(toSExpr)]);
      case "UnitName":
        return node.value;
      case "ExponentialUnitType":
        return sExpr([
          toSExpr(node.base),
          node.exponent !== undefined ? toSExpr(node.exponent) : undefined,
        ]);
      case "UnitValue":
        return sExpr([toSExpr(node.value), node.unit]);

      default:
        throw new Error(`Unknown node: ${node satisfies never}`);
    }
  };

  return sExprToString(toSExpr(node), printOptions);
}
