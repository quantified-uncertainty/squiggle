import {
  SquiggleDeserializationVisitor,
  SquiggleSerializationVisitor,
} from "../serialization/squiggle.js";
import {
  assertExpression,
  assertKind,
  assertOneOfKinds,
  assertStatement,
  assertUnitType,
} from "./asserts.js";
import {
  AnyExpressionNode,
  ASTNode,
  KindNode,
  LocationRange,
} from "./types.js";

/*
 * Derive serialized AST type from ASTNode automatically.
 */

type RequiredSerializedNodeField<T> = T extends string | number | boolean
  ? T
  : T extends {
        kind: ASTNode["kind"];
        location: LocationRange;
      }
    ? number // convert ASTNode to number
    : T extends [infer E1, infer E2]
      ? [SerializedNodeField<E1>, SerializedNodeField<E2>] // convert tuples
      : T extends [infer E1, infer E2][]
        ? [SerializedNodeField<E1>, SerializedNodeField<E2>][] // convert arrays of tuples
        : T extends (infer E)[]
          ? SerializedNodeField<E>[] // convert ASTNode[] to number[], [ASTNode, ASTNode][] to [number, number][], etc.
          : T extends Record<infer K, infer V>
            ? Record<K, SerializedNodeField<V>> // convert { string: ASTNode } to { string: number }
            : never;

type SerializedNodeField<T> = T extends null
  ? RequiredSerializedNodeField<NonNullable<T>> | null
  : RequiredSerializedNodeField<T>;

type KindNodeToSerializedNode<
  T extends ASTNode["kind"],
  Node extends { kind: T; location: LocationRange },
> = Pick<Node, "kind" | "location"> & {
  [K in keyof Node as Exclude<K, "kind" | "location">]: SerializedNodeField<
    Node[K]
  >;
};

// Trick for mapping over a discriminated union, https://stackoverflow.com/a/51691257
type Distribute<U> = U extends ASTNode
  ? KindNodeToSerializedNode<U["kind"], U>
  : never;

export type SerializedASTNode = Distribute<ASTNode>;

// It can be difficult to see if the type above is correct, but for debugging you can use something like this:
// type T = Extract<SerializedASTNode, { kind: "Program" }>;
// Uncomment the line above and hover over it it VS Code to check the output.

export function serializeAstNode(
  node: ASTNode,
  visit: SquiggleSerializationVisitor
): SerializedASTNode {
  switch (node.kind) {
    case "Program":
      return {
        ...node,
        imports: node.imports.map(visit.ast),
        statements: node.statements.map(visit.ast),
        result: node.result ? visit.ast(node.result) : null,
        symbols: Object.fromEntries(
          Object.entries(node.symbols).map(([key, value]) => [
            key,
            visit.ast(value),
          ])
        ),
      };
    case "Import":
      return {
        ...node,
        path: visit.ast(node.path),
        variable: visit.ast(node.variable),
      };
    case "Block":
      return {
        ...node,
        statements: node.statements.map(visit.ast),
        result: visit.ast(node.result),
      };
    case "LetStatement":
      return {
        ...node,
        decorators: node.decorators.map(visit.ast),
        variable: visit.ast(node.variable),
        unitTypeSignature: node.unitTypeSignature
          ? visit.ast(node.unitTypeSignature)
          : null,
        value: visit.ast(node.value),
      };
    case "DefunStatement":
      return {
        ...node,
        decorators: node.decorators.map(visit.ast),
        variable: visit.ast(node.variable),
        value: visit.ast(node.value),
      };
    case "Lambda":
      return {
        ...node,
        args: node.args.map(visit.ast),
        body: visit.ast(node.body),
        returnUnitType: node.returnUnitType
          ? visit.ast(node.returnUnitType)
          : null,
      };
    case "Array":
      return {
        ...node,
        elements: node.elements.map(visit.ast),
      };
    case "Dict":
      return {
        ...node,
        elements: node.elements.map(visit.ast),
      };
    case "KeyValue":
      return {
        ...node,
        key: visit.ast(node.key),
        value: visit.ast(node.value),
      };
    case "UnitValue":
      return {
        ...node,
        value: visit.ast(node.value),
      };
    case "Call":
      return {
        ...node,
        fn: visit.ast(node.fn),
        args: node.args.map(visit.ast),
      };
    case "InfixCall":
      return {
        ...node,
        args: [visit.ast(node.args[0]), visit.ast(node.args[1])],
      };
    case "UnaryCall":
      return {
        ...node,
        arg: visit.ast(node.arg),
      };
    case "Pipe":
      return {
        ...node,
        leftArg: visit.ast(node.leftArg),
        fn: visit.ast(node.fn),
        rightArgs: node.rightArgs.map(visit.ast),
      };
    case "Decorator":
      return {
        ...node,
        name: visit.ast(node.name),
        args: node.args.map(visit.ast),
      };
    case "DotLookup":
      return {
        ...node,
        arg: visit.ast(node.arg),
      };
    case "BracketLookup":
      return {
        ...node,
        arg: visit.ast(node.arg),
        key: visit.ast(node.key),
      };
    case "Ternary":
      return {
        ...node,
        condition: visit.ast(node.condition),
        trueExpression: visit.ast(node.trueExpression),
        falseExpression: visit.ast(node.falseExpression),
      };
    case "UnitTypeSignature":
      return {
        ...node,
        body: visit.ast(node.body),
      };
    case "InfixUnitType":
      return {
        ...node,
        args: [visit.ast(node.args[0]), visit.ast(node.args[1])],
      };
    case "ExponentialUnitType":
      return {
        ...node,
        base: visit.ast(node.base),
        exponent: visit.ast(node.exponent),
      };
    case "LambdaParameter":
      return {
        ...node,
        variable: visit.ast(node.variable),
        annotation: node.annotation && visit.ast(node.annotation),
        unitTypeSignature:
          node.unitTypeSignature && visit.ast(node.unitTypeSignature),
      };
    case "Float":
    case "String":
    case "Boolean":
    case "Identifier":
    case "UnitName":
      return node;
    default:
      throw node satisfies never;
  }
}

export function deserializeAstNode(
  node: SerializedASTNode,
  visit: SquiggleDeserializationVisitor
): ASTNode {
  switch (node.kind) {
    case "Program":
      return {
        ...node,

        imports: node.imports
          .map(visit.ast)
          .map((node) => assertKind(node, "Import")),
        statements: node.statements.map(visit.ast).map(assertStatement),
        result: node.result ? assertExpression(visit.ast(node.result)) : null,
        symbols: Object.fromEntries(
          Object.entries(node.symbols).map(([key, value]) => [
            key,
            visit.ast(value),
          ])
        ),
      };
    case "Import":
      return {
        ...node,
        path: assertKind(visit.ast(node.path), "String"),
        variable: assertKind(visit.ast(node.variable), "Identifier"),
      };
    case "Block":
      return {
        ...node,
        statements: node.statements.map(visit.ast).map(assertStatement),
        result: assertExpression(visit.ast(node.result)),
      };
    case "LetStatement":
      return {
        ...node,

        decorators: node.decorators
          .map(visit.ast)
          .map((node) => assertKind(node, "Decorator")),
        variable: assertKind(visit.ast(node.variable), "Identifier"),
        unitTypeSignature: node.unitTypeSignature
          ? assertKind(visit.ast(node.unitTypeSignature), "UnitTypeSignature")
          : null,
        value: assertExpression(visit.ast(node.value)),
      };
    case "DefunStatement":
      return {
        ...node,
        decorators: node.decorators
          .map(visit.ast)
          .map((node) => assertKind(node, "Decorator")),
        variable: assertKind(visit.ast(node.variable), "Identifier"),
        value: assertKind(visit.ast(node.value), "Lambda"),
      };
    case "Lambda":
      return {
        ...node,
        args: node.args
          .map(visit.ast)
          .map((node) => assertKind(node, "LambdaParameter")),
        body: assertExpression(visit.ast(node.body)),
        returnUnitType: node.returnUnitType
          ? assertKind(visit.ast(node.returnUnitType), "UnitTypeSignature")
          : null,
      };
    case "Array":
      return {
        ...node,
        elements: node.elements.map(visit.ast).map(assertExpression),
      };
    case "Dict":
      return {
        ...node,
        elements: node.elements
          .map(visit.ast)
          .map((node) => assertOneOfKinds(node, ["KeyValue", "Identifier"])),
      };
    case "KeyValue":
      return {
        ...node,
        key: visit.ast(node.key) as AnyExpressionNode,
        value: visit.ast(node.value) as AnyExpressionNode,
      };
    case "UnitValue":
      return {
        ...node,
        value: visit.ast(node.value) as KindNode<"Float">,
      };
    case "Call":
      return {
        ...node,
        fn: assertExpression(visit.ast(node.fn)),
        args: node.args.map(visit.ast).map(assertExpression),
      };
    case "InfixCall":
      return {
        ...node,
        args: [
          assertExpression(visit.ast(node.args[0])),
          assertExpression(visit.ast(node.args[1])),
        ],
      };
    case "UnaryCall":
      return {
        ...node,
        arg: assertExpression(visit.ast(node.arg)),
      };
    case "Pipe":
      return {
        ...node,
        leftArg: assertExpression(visit.ast(node.leftArg)),
        fn: assertExpression(visit.ast(node.fn)),
        rightArgs: node.rightArgs.map(visit.ast).map(assertExpression),
      };
    case "Decorator":
      return {
        ...node,
        name: assertKind(visit.ast(node.name), "Identifier"),
        args: node.args.map(visit.ast).map(assertExpression),
      };
    case "DotLookup":
      return {
        ...node,
        arg: assertExpression(visit.ast(node.arg)),
      };
    case "BracketLookup":
      return {
        ...node,
        arg: assertExpression(visit.ast(node.arg)),
        key: assertExpression(visit.ast(node.key)),
      };
    case "Ternary":
      return {
        ...node,
        condition: assertExpression(visit.ast(node.condition)),
        trueExpression: assertExpression(visit.ast(node.trueExpression)),
        falseExpression: assertExpression(visit.ast(node.falseExpression)),
      };
    case "UnitTypeSignature":
      return {
        ...node,
        body: assertUnitType(visit.ast(node.body)),
      };
    case "InfixUnitType":
      return {
        ...node,
        args: [
          assertUnitType(visit.ast(node.args[0])),
          assertUnitType(visit.ast(node.args[1])),
        ],
      };
    case "ExponentialUnitType":
      return {
        ...node,
        base: assertUnitType(visit.ast(node.base)),
        exponent: assertKind(visit.ast(node.exponent), "Float"),
      };
    case "LambdaParameter":
      return {
        ...node,
        variable: assertKind(visit.ast(node.variable), "Identifier"),
        annotation:
          node.annotation !== null
            ? assertExpression(visit.ast(node.annotation))
            : null,
        unitTypeSignature:
          node.unitTypeSignature !== null
            ? assertKind(visit.ast(node.unitTypeSignature), "UnitTypeSignature")
            : null,
      };
    case "Identifier":
    case "Float":
    case "String":
    case "Boolean":
    case "UnitName":
      return node;
    default:
      throw node satisfies never;
  }
}
