import {
  SquiggleDeserializationVisitor,
  SquiggleSerializationVisitor,
} from "../serialization/squiggle.js";
import { ASTNode, KindNode, LocationRange, NamedNodeLambda } from "./types.js";

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
        imports: node.imports.map((item) => [
          visit.ast(item[0]),
          visit.ast(item[1]),
        ]),
        statements: node.statements.map(visit.ast),
        result: node.result ? visit.ast(node.result) : null,
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
        imports: node.imports.map((item) => [
          visit.ast(item[0]) as KindNode<"String">,
          visit.ast(item[0]) as KindNode<"Identifier">,
        ]),
        statements: node.statements.map(visit.ast),
        result: node.result ? visit.ast(node.result) : null,
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
        decorators: node.decorators.map(visit.ast) as KindNode<"Decorator">[],
        variable: visit.ast(node.variable) as KindNode<"Identifier">,
        unitTypeSignature: node.unitTypeSignature
          ? (visit.ast(node.unitTypeSignature) as KindNode<"UnitTypeSignature">)
          : null,
        value: visit.ast(node.value),
      };
    case "DefunStatement":
      return {
        ...node,
        decorators: node.decorators.map(visit.ast) as KindNode<"Decorator">[],
        variable: visit.ast(node.variable) as KindNode<"Identifier">,
        value: visit.ast(node.value) as NamedNodeLambda,
      };
    case "Lambda":
      return {
        ...node,
        args: node.args.map(visit.ast),
        body: visit.ast(node.body),
        returnUnitType: node.returnUnitType
          ? (visit.ast(node.returnUnitType) as KindNode<"UnitTypeSignature">)
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
        elements: node.elements.map(
          (node) => visit.ast(node) as KindNode<"KeyValue" | "Identifier">
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
        name: visit.ast(node.name) as KindNode<"Identifier">,
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
    case "Identifier":
      return {
        ...node,
      };
    case "LambdaParameter":
      return {
        ...node,
        variable: visit.ast(node.variable) as KindNode<"Identifier">,
        annotation:
          node.annotation !== null ? visit.ast(node.annotation) : null,
        unitTypeSignature:
          node.unitTypeSignature !== null
            ? (visit.ast(
                node.unitTypeSignature
              ) as KindNode<"UnitTypeSignature">)
            : null,
      };
    case "Float":
    case "String":
    case "Boolean":
      return node;
    default:
      throw node satisfies never;
  }
}
