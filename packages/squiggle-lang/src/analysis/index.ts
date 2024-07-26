import { AST, ASTNode, KindNode } from "../ast/types.js";
import {
  frAny,
  frArray,
  frBool,
  frDictWithArbitraryKeys,
  frNumber,
  frString,
} from "../library/registry/frTypes.js";
import {
  AnyExpressionNode,
  AnyStatementNode,
  AnyUnitTypeNode,
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

function assertUnitType(node: TypedASTNode): asserts node is AnyUnitTypeNode {
  assertOneOfKinds(node, unitTypeKinds, "unit type");
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

function analyzeUnitType(node: ASTNode, symbols: SymbolTable): AnyUnitTypeNode {
  const typedNode = analyzeAstNode(node, symbols);
  assertUnitType(typedNode);
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

// Identifier definitions (e.g. `x` in `x = 5`) are represented as `Identifier` nodes in the AST,
// but they are treated as a separate kind of node in the analysis phase.
function analyzeIdentifierDefinition(
  node: KindNode<"Identifier">
): KindTypedNode<"IdentifierDefinition"> {
  return {
    ...node,
    kind: "IdentifierDefinition",
  };
}

function analyzeAstNode(node: ASTNode, symbols: SymbolTable): TypedASTNode {
  switch (node.kind) {
    case "Program": {
      const imports = node.imports.map(([path, alias]) => {
        const typedPath = analyzeKind(path, "String", symbols);
        const typedAlias = analyzeIdentifierDefinition(alias);
        return [typedPath, typedAlias] as [
          KindTypedNode<"String">,
          KindTypedNode<"IdentifierDefinition">,
        ];
      });
      const statements = node.statements.map((statement) =>
        analyzeStatement(statement, symbols)
      );
      const programSymbols: KindTypedNode<"Program">["symbols"] = {};
      for (const statement of statements) {
        programSymbols[statement.variable.value] = statement;
      }

      const result = node.result
        ? analyzeExpression(node.result, symbols)
        : null;

      return {
        ...node,
        imports,
        statements,
        result,
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
        type: result.type,
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
        variable: analyzeIdentifierDefinition(node.variable),
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
        variable: analyzeIdentifierDefinition(node.variable),
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
        type: frAny(), // TODO - lambda type
      };
    }
    case "LambdaParameter": {
      return {
        ...node,
        variable: analyzeIdentifierDefinition(node.variable),
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
        type: frAny(), // TODO - resolve from definition
      };
    }
    case "String": {
      return {
        ...node,
        type: frString,
      };
    }
    case "Float": {
      return {
        ...node,
        type: frNumber,
      };
    }
    case "Boolean": {
      return {
        ...node,
        type: frBool,
      };
    }
    case "Array": {
      const elements = node.elements.map((element) =>
        analyzeExpression(element, symbols)
      );

      return {
        ...node,
        elements,
        // TODO - get the type from the elements
        type: frArray(frAny()),
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
        type: frDictWithArbitraryKeys(frAny()),
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
        type: frNumber,
      };
    }
    case "Call": {
      const fn = analyzeExpression(node.fn, symbols);
      const args = node.args.map((arg) => analyzeExpression(arg, symbols));

      return {
        ...node,
        fn,
        args,
        type: frAny(), // TODO - function result type
      };
    }
    case "InfixCall": {
      return {
        ...node,
        args: [
          analyzeExpression(node.args[0], symbols),
          analyzeExpression(node.args[1], symbols),
        ],
        type: frAny(), // TODO - function result type
      };
    }
    case "UnaryCall": {
      return {
        ...node,
        arg: analyzeExpression(node.arg, symbols),
        type: frAny(), // TODO - function result type
      };
    }
    case "Pipe": {
      return {
        ...node,
        leftArg: analyzeExpression(node.leftArg, symbols),
        fn: analyzeExpression(node.fn, symbols),
        rightArgs: node.rightArgs.map((arg) => analyzeExpression(arg, symbols)),
        type: frAny(), // TODO - function result type
      };
    }
    case "DotLookup": {
      return {
        ...node,
        arg: analyzeExpression(node.arg, symbols),
        type: frAny(), // TODO
      };
    }
    case "BracketLookup": {
      return {
        ...node,
        arg: analyzeExpression(node.arg, symbols),
        key: analyzeExpression(node.key, symbols),
        type: frAny(), // TODO
      };
    }
    case "Ternary": {
      return {
        ...node,
        condition: analyzeExpression(node.condition, symbols),
        trueExpression: analyzeExpression(node.trueExpression, symbols),
        falseExpression: analyzeExpression(node.falseExpression, symbols),
        type: frAny(), // TODO
      };
    }
    case "UnitTypeSignature": {
      return {
        ...node,
        body: analyzeUnitType(node.body, symbols),
      };
    }
    case "InfixUnitType":
      return {
        ...node,
        args: [
          analyzeUnitType(node.args[0], symbols),
          analyzeUnitType(node.args[1], symbols),
        ],
      };
    case "ExponentialUnitType":
      return {
        ...node,
        base: analyzeUnitType(node.base, symbols),
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
