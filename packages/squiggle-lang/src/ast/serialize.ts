import {
  SquiggleDeserializationVisitor,
  SquiggleSerializationVisitor,
} from "../serialization/squiggle.js";
import { ASTNode, LocationRange, NamedNodeLambda } from "./types.js";

type TypedNode<T extends ASTNode["type"]> = Extract<ASTNode, { type: T }>;

/*
 * Derive serialized AST type from ASTNode automatically.
 */

type SerializedNodeField<T> = T extends string | number | boolean | null
  ? T
  : T extends {
        type: ASTNode["type"];
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

type TypedNodeToSerializedNode<
  T extends ASTNode["type"],
  Node extends { type: T; location: LocationRange },
> = Pick<Node, "type" | "location"> & {
  [K in keyof Node as Exclude<K, "type" | "location">]: SerializedNodeField<
    Node[K]
  >;
};

// Trick for mapping over a discriminated union, https://stackoverflow.com/a/51691257
type Distribute<U> = U extends ASTNode
  ? TypedNodeToSerializedNode<U["type"], U>
  : never;

export type SerializedASTNode = Distribute<ASTNode>;

// It can be difficult to see if the type above is correct, but for debugging you can use something like this:
// type T = Extract<SerializedASTNode, { type: "Program" }>;
// Uncomment the line above and hover over it it VS Code to check the output.

export function serializeAstNode(
  node: ASTNode,
  visit: SquiggleSerializationVisitor
): SerializedASTNode {
  switch (node.type) {
    case "Program":
      return {
        ...node,
        imports: node.imports.map((item) => [
          visit.ast(item[0]),
          visit.ast(item[1]),
        ]),
        statements: node.statements.map(visit.ast),
        symbols: Object.fromEntries(
          Object.entries(node.symbols).map(([key, value]) => [
            key,
            visit.ast(value),
          ])
        ),
      };
    case "Block":
      return {
        ...node,
        statements: node.statements.map(visit.ast),
      };
    case "DecoratedStatement":
      return {
        ...node,
        decorator: visit.ast(node.decorator),
        statement: visit.ast(node.statement),
      };
    case "LetStatement":
    case "DefunStatement":
      return {
        ...node,
        variable: visit.ast(node.variable),
        value: visit.ast(node.value),
      };
    case "Lambda":
      return {
        ...node,
        args: node.args.map(visit.ast),
        body: visit.ast(node.body),
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
        symbols: Object.fromEntries(
          Object.entries(node.symbols).map(([key, value]) => [
            key,
            visit.ast(value),
          ])
        ),
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
    case "Identifier":
      return node;
    case "IdentifierWithAnnotation":
      return {
        ...node,
        annotation: visit.ast(node.annotation),
      };
    case "Float":
    case "String":
    case "Boolean":
      return node;
    default:
      throw node satisfies never;
  }
}

export function deserializeAstNode(
  node: SerializedASTNode,
  visit: SquiggleDeserializationVisitor
): ASTNode {
  switch (node.type) {
    case "Program":
      return {
        ...node,
        imports: node.imports.map((item) => [
          visit.ast(item[0]) as TypedNode<"String">,
          visit.ast(item[0]) as TypedNode<"Identifier">,
        ]),
        statements: node.statements.map(visit.ast),
        symbols: Object.fromEntries(
          Object.entries(node.symbols).map(([key, value]) => [
            key,
            visit.ast(value),
          ])
        ),
      };
    case "Block":
      return {
        ...node,
        statements: node.statements.map(visit.ast),
      };
    case "DecoratedStatement":
      return {
        ...node,
        decorator: visit.ast(node.decorator) as TypedNode<"Decorator">,
        statement: visit.ast(node.statement) as TypedNode<"LetStatement">,
      };
    case "LetStatement":
      return {
        ...node,
        variable: visit.ast(node.variable) as TypedNode<"Identifier">,
        value: visit.ast(node.value),
      };
    case "DefunStatement":
      return {
        ...node,
        variable: visit.ast(node.variable) as TypedNode<"Identifier">,
        value: visit.ast(node.value) as NamedNodeLambda,
      };
    case "Lambda":
      return {
        ...node,
        args: node.args.map(visit.ast),
        body: visit.ast(node.body),
      };
    case "Array":
      return {
        ...node,
        elements: node.elements.map(visit.ast),
      };
    case "Dict":
      return {
        ...node,
        elements: node.elements.map(
          (node) => visit.ast(node) as TypedNode<"KeyValue" | "Identifier">
        ),
        symbols: Object.fromEntries(
          Object.entries(node.symbols).map(([key, value]) => [
            key,
            visit.ast(value) as TypedNode<"KeyValue" | "Identifier">,
          ])
        ),
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
        name: visit.ast(node.name) as TypedNode<"Identifier">,
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
    case "Identifier":
      return node;
    case "IdentifierWithAnnotation":
      return {
        ...node,
        annotation: visit.ast(node.annotation),
      };
    case "Float":
    case "String":
    case "Boolean":
      return node;
    default:
      throw node satisfies never;
  }
}
