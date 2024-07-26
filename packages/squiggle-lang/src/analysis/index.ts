import { AST, ASTNode, KindNode } from "../ast/types.js";
import {
  frAny,
  frArray,
  frBool,
  frDictWithArbitraryKeys,
  frNumber,
  frString,
} from "../library/registry/frTypes.js";
import { ImmutableMap } from "../utility/immutable.js";
import {
  AnyExpressionNode,
  AnyStatementNode,
  AnyUnitTypeNode,
  expressionKinds,
  KindTypedNode,
  statementKinds,
  TypedAST,
  TypedASTNode,
  unitTypeKinds,
} from "./types.js";

type AnalysisContext = {
  definitions: ImmutableMap<string, KindTypedNode<"IdentifierDefinition">>;
};

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
  context: AnalysisContext
): KindTypedNode<Kind> {
  const typedNode = analyzeAstNode(node, context);
  assertKind(typedNode, kind);
  return typedNode;
}

function analyzeOneOfKinds<Kind extends TypedASTNode["kind"]>(
  node: ASTNode,
  kinds: Kind[],
  context: AnalysisContext
): KindTypedNode<Kind> {
  const typedNode = analyzeAstNode(node, context);
  assertOneOfKinds(typedNode, kinds);
  return typedNode;
}

function analyzeExpression(
  node: ASTNode,
  context: AnalysisContext
): AnyExpressionNode {
  const typedNode = analyzeAstNode(node, context);
  assertExpression(typedNode);
  return typedNode;
}

function analyzeUnitType(
  node: ASTNode,
  context: AnalysisContext
): AnyUnitTypeNode {
  const typedNode = analyzeAstNode(node, context);
  assertUnitType(typedNode);
  return typedNode;
}

function analyzeStatement(
  node: ASTNode,
  symbols: AnalysisContext
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

function analyzeAstNode(node: ASTNode, context: AnalysisContext): TypedASTNode {
  switch (node.kind) {
    case "Program": {
      const imports: [
        KindTypedNode<"String">,
        KindTypedNode<"IdentifierDefinition">,
      ][] = [];
      for (const [path, alias] of node.imports) {
        const typedPath = analyzeKind(path, "String", context);
        const typedAlias = analyzeIdentifierDefinition(alias);
        imports.push([typedPath, typedAlias]);
      }

      const statements: AnyStatementNode[] = [];
      for (const statement of node.statements) {
        const typedStatement = analyzeStatement(statement, context);
        statements.push(typedStatement);
        context.definitions = context.definitions.set(
          typedStatement.variable.value,
          typedStatement.variable
        );
      }

      const programSymbols: KindTypedNode<"Program">["symbols"] = {};
      for (const statement of statements) {
        programSymbols[statement.variable.value] = statement;
      }

      const result = node.result
        ? analyzeExpression(node.result, context)
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
      // snapshot definitions - we won't store them since they're local
      const definitions = context.definitions;

      const statements: AnyStatementNode[] = [];
      for (const statement of node.statements) {
        const typedStatement = analyzeStatement(statement, context);
        statements.push(typedStatement);

        // we're modifying context here but will refert `context.definitions` when the block is processed
        context.definitions = context.definitions.set(
          typedStatement.variable.value,
          typedStatement.variable
        );
      }

      const result = analyzeExpression(node.result, context);

      context.definitions = definitions;
      return {
        ...node,
        statements,
        result,
        type: result.type,
      };
    }
    case "LetStatement": {
      const value = analyzeAstNode(node.value, context);
      assertExpression(value);
      const decorators = node.decorators.map((decorator) =>
        analyzeKind(decorator, "Decorator", context)
      );

      return {
        ...node,
        decorators,
        value,
        variable: analyzeIdentifierDefinition(node.variable),
        unitTypeSignature: node.unitTypeSignature
          ? analyzeKind(node.unitTypeSignature, "UnitTypeSignature", context)
          : null,
      };
    }
    case "Decorator": {
      // decorator names never refer to user-defined variables, so we always resolve them to `Tag.*` builtins
      const name: KindTypedNode<"Identifier"> = {
        ...node.name,
        resolved: { kind: "builtin" },
        type: frAny(), // TODO - from stdlib
      };

      const args = node.args.map((arg) => {
        const typedArg = analyzeAstNode(arg, context);
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
        analyzeKind(decorator, "Decorator", context)
      );
      const value = analyzeKind(node.value, "Lambda", context);

      return {
        ...node,
        decorators,
        value,
        variable: analyzeIdentifierDefinition(node.variable),
        exported: node.exported,
      };
    }
    case "Lambda": {
      const definitions = context.definitions;

      const args = node.args.map((arg) =>
        analyzeKind(arg, "LambdaParameter", context)
      );
      for (const arg of args) {
        context.definitions = context.definitions.set(
          arg.variable.value,
          arg.variable
        );
      }
      const body = analyzeExpression(node.body, context);

      // revert definitions
      context.definitions = definitions;

      return {
        ...node,
        args,
        body,
        name: node.name,
        returnUnitType: node.returnUnitType
          ? analyzeKind(node.returnUnitType, "UnitTypeSignature", context)
          : null,
        type: frAny(), // TODO - lambda type
      };
    }
    case "LambdaParameter": {
      return {
        ...node,
        variable: analyzeIdentifierDefinition(node.variable),
        annotation: node.annotation
          ? analyzeExpression(node.annotation, context)
          : null,
        unitTypeSignature: node.unitTypeSignature
          ? analyzeKind(node.unitTypeSignature, "UnitTypeSignature", context)
          : null,
      };
    }
    case "Identifier": {
      const definition = context.definitions.get(node.value);
      return {
        ...node,
        resolved: definition
          ? { kind: "definition", node: definition }
          : { kind: "builtin" },
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
        analyzeExpression(element, context)
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
        analyzeOneOfKinds(element, ["KeyValue", "Identifier"], context)
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
        key: analyzeExpression(node.key, context),
        value: analyzeExpression(node.value, context),
      };
    }
    case "UnitValue": {
      return {
        ...node,
        value: analyzeKind(node.value, "Float", context),
        type: frNumber,
      };
    }
    case "Call": {
      const fn = analyzeExpression(node.fn, context);
      const args = node.args.map((arg) => analyzeExpression(arg, context));

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
          analyzeExpression(node.args[0], context),
          analyzeExpression(node.args[1], context),
        ],
        type: frAny(), // TODO - function result type
      };
    }
    case "UnaryCall": {
      return {
        ...node,
        arg: analyzeExpression(node.arg, context),
        type: frAny(), // TODO - function result type
      };
    }
    case "Pipe": {
      return {
        ...node,
        leftArg: analyzeExpression(node.leftArg, context),
        fn: analyzeExpression(node.fn, context),
        rightArgs: node.rightArgs.map((arg) => analyzeExpression(arg, context)),
        type: frAny(), // TODO - function result type
      };
    }
    case "DotLookup": {
      return {
        ...node,
        arg: analyzeExpression(node.arg, context),
        type: frAny(), // TODO
      };
    }
    case "BracketLookup": {
      return {
        ...node,
        arg: analyzeExpression(node.arg, context),
        key: analyzeExpression(node.key, context),
        type: frAny(), // TODO
      };
    }
    case "Ternary": {
      return {
        ...node,
        condition: analyzeExpression(node.condition, context),
        trueExpression: analyzeExpression(node.trueExpression, context),
        falseExpression: analyzeExpression(node.falseExpression, context),
        type: frAny(), // TODO
      };
    }
    case "UnitTypeSignature": {
      return {
        ...node,
        body: analyzeUnitType(node.body, context),
      };
    }
    case "InfixUnitType":
      return {
        ...node,
        args: [
          analyzeUnitType(node.args[0], context),
          analyzeUnitType(node.args[1], context),
        ],
      };
    case "ExponentialUnitType":
      return {
        ...node,
        base: analyzeUnitType(node.base, context),
        exponent: analyzeKind(node.exponent, "Float", context),
      };
    default:
      return node satisfies never;
  }
}

export function analyzeAst(ast: AST): TypedAST {
  const typedProgram = analyzeAstNode(ast, {
    definitions: ImmutableMap(),
  });

  return {
    ...(typedProgram as KindTypedNode<"Program">),
    raw: ast,
    comments: ast.comments,
  };
}
