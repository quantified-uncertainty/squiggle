import { AST, ASTNode } from "../ast/types.js";
import { frAny } from "../library/registry/frTypes.js";
import {
  AnyExpressionNode,
  AnyStatementNode,
  expressionKinds,
  KindTypedNode,
  statementKinds,
  SymbolTable,
  TypedAST,
  TypedASTNode,
  unitTypeKinds,
} from "./types.js";

function assertKind<Kind extends TypedASTNode["kind"]>(
  node: TypedASTNode,
  kind: Kind
): asserts node is KindTypedNode<Kind> {
  if (node.kind !== kind) {
    throw new Error(`Expected ${kind}, got ${node.kind}`);
  }
}

function assertOneOfKinds<Kind extends TypedASTNode["kind"]>(
  node: TypedASTNode,
  kinds: readonly Kind[],
  kindsName?: string
): asserts node is KindTypedNode<Kind> {
  if (!(kinds as readonly string[]).includes(node.kind)) {
    throw new Error(
      `Expected ${kindsName ?? kinds.join("|")}, got ${node.kind}`
    );
  }
}

function assertStatement(node: TypedASTNode): asserts node is AnyStatementNode {
  assertOneOfKinds(node, statementKinds, "statement");
}

function assertExpression(
  node: TypedASTNode
): asserts node is AnyExpressionNode {
  assertOneOfKinds(node, expressionKinds, "expression");
}

function analyzeKind<Kind extends TypedASTNode["kind"]>(
  node: ASTNode,
  kind: Kind,
  symbols: SymbolTable
): KindTypedNode<Kind> {
  const typedNode = analyzeAstNode(node, symbols);
  assertKind(typedNode, kind);
  return typedNode;
}

function analyzeOneOfKinds<Kind extends TypedASTNode["kind"]>(
  node: ASTNode,
  kinds: Kind[],
  symbols: SymbolTable
): KindTypedNode<Kind> {
  const typedNode = analyzeAstNode(node, symbols);
  assertOneOfKinds(typedNode, kinds);
  return typedNode;
}

function analyzeExpression(
  node: ASTNode,
  symbols: SymbolTable
): AnyExpressionNode {
  const typedNode = analyzeAstNode(node, symbols);
  assertExpression(typedNode);
  return typedNode;
}

function analyzeStatement(
  node: ASTNode,
  symbols: SymbolTable
): AnyStatementNode {
  const typedNode = analyzeAstNode(node, symbols);
  assertStatement(typedNode);
  return typedNode;
}

function analyzeAstNode(node: ASTNode, symbols: SymbolTable): TypedASTNode {
  switch (node.kind) {
    case "Program": {
      const imports = node.imports.map(([path, alias]) => {
        const typedPath = analyzeKind(path, "String", symbols);
        const typedAlias = analyzeKind(alias, "Identifier", symbols);
        return [typedPath, typedAlias] as [
          KindTypedNode<"String">,
          KindTypedNode<"Identifier">,
        ];
      });
      const statements = node.statements.map((statement) =>
        analyzeStatement(statement, symbols)
      );
      const programSymbols: KindTypedNode<"Program">["symbols"] = {};
      for (const statement of statements) {
        programSymbols[statement.variable.value] = statement;
      }

      return {
        ...node,
        imports,
        statements,
        symbols: programSymbols,
      };
    }
    // TODO typed expressions
    case "Block": {
      const statements = node.statements.map((statement) =>
        analyzeStatement(statement, symbols)
      );

      const result = analyzeExpression(node.result, symbols);

      return {
        ...node,
        statements,
        result,
        type: frAny(),
      };
    }
    case "LetStatement": {
      const value = analyzeAstNode(node.value, symbols);
      assertExpression(value);
      const decorators = node.decorators.map((decorator) =>
        analyzeKind(decorator, "Decorator", symbols)
      );

      return {
        ...node,
        decorators,
        value,
        variable: analyzeKind(node.variable, "Identifier", symbols),
        unitTypeSignature: node.unitTypeSignature
          ? analyzeKind(node.unitTypeSignature, "UnitTypeSignature", symbols)
          : null,
      };
    }
    case "Decorator": {
      const name = analyzeAstNode(node.name, symbols);
      assertKind(name, "Identifier");
      const args = node.args.map((arg) => {
        const typedArg = analyzeAstNode(arg, symbols);
        assertExpression(typedArg);
        return typedArg;
      });
      return {
        ...node,
        name,
        args,
      };
    }
    case "DefunStatement": {
      const decorators = node.decorators.map((decorator) =>
        analyzeKind(decorator, "Decorator", symbols)
      );
      const value = analyzeKind(node.value, "Lambda", symbols);

      return {
        ...node,
        decorators,
        value,
        variable: analyzeKind(node.variable, "Identifier", symbols),
        exported: node.exported,
      };
    }
    case "Lambda": {
      const args = node.args.map((arg) =>
        analyzeKind(arg, "LambdaParameter", symbols)
      );
      const body = analyzeExpression(node.body, symbols);

      return {
        ...node,
        args,
        body,
        name: node.name,
        returnUnitType: node.returnUnitType
          ? analyzeKind(node.returnUnitType, "UnitTypeSignature", symbols)
          : null,
        type: frAny(),
      };
    }
    case "LambdaParameter": {
      return {
        ...node,
        variable: node.variable,
        annotation: node.annotation
          ? analyzeExpression(node.annotation, symbols)
          : null,
        unitTypeSignature: node.unitTypeSignature
          ? analyzeKind(node.unitTypeSignature, "UnitTypeSignature", symbols)
          : null,
      };
    }
    case "Identifier": {
      return {
        ...node,
        type: frAny(),
      };
    }
    case "String": {
      return {
        ...node,
        type: frAny(),
      };
    }
    case "Float": {
      return {
        ...node,
        type: frAny(),
      };
    }
    case "Boolean": {
      return {
        ...node,
        type: frAny(),
      };
    }
    case "Array": {
      const elements = node.elements.map((element) =>
        analyzeExpression(element, symbols)
      );

      return {
        ...node,
        elements,
        type: frAny(),
      };
    }
    case "Dict": {
      const elements = node.elements.map((element) =>
        analyzeOneOfKinds(element, ["KeyValue", "Identifier"], symbols)
      );

      const dictSymbols: KindTypedNode<"Dict">["symbols"] = {};
      for (const element of elements) {
        if (element.kind === "KeyValue" && element.key.kind === "String") {
          dictSymbols[element.key.value] = element;
        } else if (element.kind === "Identifier") {
          dictSymbols[element.value] = element;
        }
      }
      return {
        ...node,
        elements,
        symbols: dictSymbols,
        type: frAny(),
      };
    }
    case "KeyValue": {
      return {
        ...node,
        key: analyzeExpression(node.key, symbols),
        value: analyzeExpression(node.value, symbols),
      };
    }
    case "UnitValue": {
      return {
        ...node,
        value: analyzeKind(node.value, "Float", symbols),
        type: frAny(),
      };
    }
    case "Call": {
      const fn = analyzeExpression(node.fn, symbols);
      const args = node.args.map((arg) => analyzeExpression(arg, symbols));

      return {
        ...node,
        fn,
        args,
        type: frAny(),
      };
    }
    case "InfixCall": {
      return {
        ...node,
        args: [
          analyzeExpression(node.args[0], symbols),
          analyzeExpression(node.args[1], symbols),
        ],
        type: frAny(),
      };
    }
    case "UnaryCall": {
      return {
        ...node,
        arg: analyzeExpression(node.arg, symbols),
        type: frAny(),
      };
    }
    case "Pipe": {
      return {
        ...node,
        leftArg: analyzeExpression(node.leftArg, symbols),
        fn: analyzeExpression(node.fn, symbols),
        rightArgs: node.rightArgs.map((arg) => analyzeExpression(arg, symbols)),
        type: frAny(),
      };
    }
    case "DotLookup": {
      return {
        ...node,
        arg: analyzeExpression(node.arg, symbols),
        type: frAny(),
      };
    }
    case "BracketLookup": {
      return {
        ...node,
        arg: analyzeExpression(node.arg, symbols),
        key: analyzeExpression(node.key, symbols),
        type: frAny(),
      };
    }
    case "Ternary": {
      return {
        ...node,
        condition: analyzeExpression(node.condition, symbols),
        trueExpression: analyzeExpression(node.trueExpression, symbols),
        falseExpression: analyzeExpression(node.falseExpression, symbols),
        type: frAny(),
      };
    }
    case "UnitTypeSignature": {
      return {
        ...node,
        body: analyzeOneOfKinds(node.body, unitTypeKinds, symbols),
      };
    }
    case "InfixUnitType":
      return {
        ...node,
        args: [
          analyzeExpression(node.args[0], symbols),
          analyzeExpression(node.args[1], symbols),
        ],
      };
    case "ExponentialUnitType":
      return {
        ...node,
        base: analyzeExpression(node.base, symbols),
        exponent: analyzeKind(node.exponent, "Float", symbols),
      };
    default:
      return node satisfies never;
  }
}

export function analyzeAst(ast: AST): TypedAST {
  const symbolTable: SymbolTable = [];
  const typedProgram = analyzeAstNode(ast, symbolTable);

  return {
    ...(typedProgram as KindTypedNode<"Program">),
    raw: ast,
    symbolTable,
    comments: ast.comments,
  };
}
