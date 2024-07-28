import { LocationRange } from "../ast/types.js";
import { NodeArray } from "./NodeArray.js";
import { NodeBlock } from "./NodeBlock.js";
import { NodeBoolean } from "./NodeBoolean.js";
import { NodeBracketLookup } from "./NodeBracketLookup.js";
import { NodeCall } from "./NodeCall.js";
import { NodeDecorator } from "./NodeDecorator.js";
import { NodeDefunStatement } from "./NodeDefunStatement.js";
import { NodeDict } from "./NodeDict.js";
import { NodeDotLookup } from "./NodeDotLookup.js";
import { NodeExponentialUnitType } from "./NodeExponentialUnitType.js";
import { NodeFloat } from "./NodeFloat.js";
import { NodeIdentifier } from "./NodeIdentifier.js";
import { NodeIdentifierDefinition } from "./NodeIdentifierDefinition.js";
import { NodeInfixCall } from "./NodeInfixCall.js";
import { NodeInfixUnitType } from "./NodeInfixUnitType.js";
import { NodeKeyValue } from "./NodeKeyValue.js";
import { NodeLambda } from "./NodeLambda.js";
import { NodeLambdaParameter } from "./NodeLambdaParameter.js";
import { NodeLetStatement } from "./NodeLetStatement.js";
import { NodePipe } from "./NodePipe.js";
import { NodeProgram } from "./NodeProgram.js";
import { NodeString } from "./NodeString.js";
import { NodeTernary } from "./NodeTernary.js";
import { NodeUnaryCall } from "./NodeUnaryCall.js";
import { NodeUnitName } from "./NodeUnitName.js";
import { NodeUnitTypeSignature } from "./NodeUnitTypeSignature.js";
import { NodeUnitValue } from "./NodeUnitValue.js";

// TODO - this name is inconsistent with `AnyNodeDictEntry` in the raw AST, rename it there

export type AnyDictEntryNode = NodeKeyValue | NodeIdentifier;

export type TypedASTNode =
  // blocks
  | NodeProgram
  | NodeBlock
  // statements
  | NodeLetStatement
  | NodeDefunStatement
  // functions & lambdas
  | NodeLambda
  // container types
  | NodeArray
  | NodeDict
  | NodeKeyValue
  // various calls
  | NodeUnitValue
  | NodeCall
  | NodeInfixCall
  | NodeUnaryCall
  | NodePipe
  | NodeDecorator
  // [] and .foo
  | NodeDotLookup
  | NodeBracketLookup
  // control flow - if/else
  | NodeTernary
  // type signature
  | NodeUnitTypeSignature
  | NodeInfixUnitType
  | NodeExponentialUnitType
  | NodeUnitName
  // identifiers
  | NodeLambdaParameter
  | NodeIdentifierDefinition
  // basic values
  | NodeIdentifier
  | NodeFloat
  | NodeString
  | NodeBoolean;

export type ASTCommentNode = {
  kind: "lineComment" | "blockComment";
  value: string;
  location: LocationRange;
};

type Kind = TypedASTNode["kind"];

export type KindTypedNode<T extends Kind> = Extract<TypedASTNode, { kind: T }>;

export const statementKinds = [
  "LetStatement",
  "DefunStatement",
] as const satisfies Kind[];

export const expressionKinds = [
  "Block",
  "Lambda",
  "Array",
  "Dict",
  "UnitValue",
  "Call",
  "InfixCall",
  "UnaryCall",
  "Pipe",
  "DotLookup",
  "BracketLookup",
  "Ternary",
  "Identifier",
  "Float",
  "String",
  "Boolean",
] as const satisfies Kind[];

export const unitTypeKinds = [
  "Identifier",
  "Float",
  "InfixUnitType",
  "ExponentialUnitType",
] as const satisfies Kind[];

export type AnyStatementNode = KindTypedNode<(typeof statementKinds)[number]>;
export type AnyExpressionNode = KindTypedNode<(typeof expressionKinds)[number]>;
export type AnyUnitTypeNode = KindTypedNode<(typeof unitTypeKinds)[number]>;

export type TypedAST = NodeProgram;
