import { type AstPath, type Doc, type Printer } from "prettier";
import * as doc from "prettier/doc";

import { type ASTCommentNode, type ASTNode } from "@quri/squiggle-lang";

import { PatchedASTNode, PrettierUtil, type SquiggleNode } from "./types.js";

const { group, indent, softline, line, hardline, join, ifBreak } = doc.builders;

function getNodePrecedence(node: SquiggleNode): number {
  const infixPrecedence = {
    "||": 2,
    "&&": 3,
    "==": 4,
    "!=": 4,
    "<=": 5,
    "<": 5,
    ">=": 5,
    ">": 5,
    to: 6,
    "+": 7,
    "-": 7,
    ".+": 7,
    ".-": 7,
    "*": 8,
    "/": 8,
    ".*": 8,
    "./": 8,
    "^": 9,
    ".^": 9,
    "->": 10,
    "|>": 10, // removed since 0.8.0
  };
  switch (node.type) {
    case "Ternary":
      return 1;
    case "InfixCall": {
      const precedence = infixPrecedence[node.op];
      if (precedence === undefined) {
        throw new Error(`Unknown operator ${node.op}`);
      }
      return precedence;
    }
    case "Pipe":
      return 11;
    case "UnaryCall":
      return 12;
    case "DotLookup":
    case "BracketLookup":
    case "Call":
      return 13;
    case "Block":
      if (node.statements.length === 1) {
        // will be unwrapped by printer
        return getNodePrecedence(node.statements[0]);
      }
    default:
      return 100;
  }
}
export function createSquigglePrinter(
  util: PrettierUtil
): Printer<SquiggleNode> {
  return {
    print: (path, options, print) => {
      const { node } = path;
      const typedPath = <T extends SquiggleNode>(_: T) => {
        return path as AstPath<T>;
      };

      const printChild = (
        doc: Doc,
        parentNode: SquiggleNode,
        childNode: SquiggleNode,
        rightSide: boolean = false
      ) => {
        const parentPrecedence = getNodePrecedence(parentNode);
        const childPrecedence = getNodePrecedence(childNode);
        const needParens = rightSide
          ? childPrecedence <= parentPrecedence // handles 4 / (5 / 6) case
          : childPrecedence < parentPrecedence;

        // TODO - indent
        return needParens ? ["(", doc, ")"] : doc;
      };

      switch (node.type) {
        case "Program":
          // TODO - preserve line breaks, break long lines
          // TODO - comments will be moved to the end because imports is not a real AST, need to be fixed in squiggle-lang
          return group([
            node.imports.map((_, i) => [
              "import ",
              typedPath(node).call(print, "imports", i, 0),
              " as ",
              typedPath(node).call(print, "imports", i, 1),
              hardline,
            ]),
            join(
              hardline,
              node.statements.map((statement, i) => [
                typedPath(node).call(print, "statements", i),
                // keep extra new lines
                util.isNextLineEmpty(
                  options.originalText,
                  statement.location.end.offset
                )
                  ? hardline
                  : "",
              ])
            ),
            node.statements.length &&
            ["LetStatement", "DefunStatement"].includes(
              node.statements[node.statements.length - 1].type
            )
              ? hardline // new line if final expression is a statement
              : "",
          ]);
        case "Block": {
          if (
            node.statements.length === 1 &&
            !node.comments &&
            !(node.statements[0] as PatchedASTNode).comments
          ) {
            return typedPath(node).call(print, "statements", 0);
          }

          const content = join(
            hardline,
            node.statements.map((statement, i) => [
              typedPath(node).call(print, "statements", i),
              // keep extra new lines
              util.isNextLineEmpty(
                options.originalText,
                statement.location.end.offset
              )
                ? hardline
                : "",
            ])
          );

          return node.isLambdaBody
            ? content
            : group(["{", indent([line, content]), line, "}"]);
        }
        case "LetStatement":
          return group([
            node.exported ? "export " : "",
            node.variable.value,
            " = ",
            typedPath(node).call(print, "value"),
          ]);
        case "DefunStatement":
          return group([
            node.exported ? "export " : "",
            node.variable.value,
            group([
              "(",
              indent([
                softline,
                join([",", line], typedPath(node).map(print, "value", "args")),
              ]),
              softline,
              ")",
            ]),
            " = ",
            typedPath(node).call(print, "value", "body"),
          ]);
        case "Boolean":
          return node.value ? "true" : "false";
        case "Float": {
          const fractional =
            node.fractional === null
              ? ""
              : "." + (node.fractional.replace(/0*$/, "") || "0"); // cut all trailing zeroes, but keep at least one

          const exponent = node.exponent === null ? "" : `e${node.exponent}`;

          return `${node.integer}${fractional}${exponent}`;
        }
        case "Array":
          return group([
            "[",
            indent([softline, join([",", line], path.map(print, "elements"))]),
            ifBreak(",", ""), // trailing comma
            softline,
            "]",
          ]);
        case "Call":
          return group([
            typedPath(node).call(print, "fn"), // parenthesize?..
            "(",
            indent([
              softline,
              join([",", line], typedPath(node).map(print, "args")),
            ]),
            softline,
            ")",
          ]);
        case "InfixCall":
          const args = ([0, 1] as const).map((i) =>
            printChild(
              typedPath(node).call(print, "args", i),
              node,
              node.args[i],
              i === 1
            )
          );

          return group([args[0], " ", node.op, indent([line, args[1]])]);
        case "UnaryCall":
          return group([
            node.op,
            printChild(typedPath(node).call(print, "arg"), node, node.arg),
          ]);
        case "Pipe": {
          const args = node.rightArgs.length
            ? [
                "(",
                indent([
                  softline,
                  join([",", line], typedPath(node).map(print, "rightArgs")),
                ]),
                softline,
                ")",
              ]
            : [];
          return group([
            printChild(
              typedPath(node).call(print, "leftArg"),
              node,
              node.leftArg
            ),
            " ->",
            line,
            printChild(typedPath(node).call(print, "fn"), node, node.fn),
            args,
          ]);
        }
        case "DotLookup":
          return group([typedPath(node).call(print, "arg"), ".", node.key]);
        case "BracketLookup":
          return group([
            typedPath(node).call(print, "arg"),
            "[",
            typedPath(node).call(print, "key"),
            "]",
          ]);
        case "Identifier":
          return node.value;
        case "IdentifierWithAnnotation":
          return [
            node.variable,
            ": ",
            typedPath(node).call(print, "annotation"),
          ];
        case "KeyValue": {
          const key =
            node.key.type === "String" &&
            node.key.value.match(/^[\$_a-z]+[\$_a-zA-Z0-9]*$/)
              ? node.key.value
              : typedPath(node).call(print, "key");

          return group([
            key,
            // it would be better to allow a break here, but it's hard to format well */
            ": ",
            typedPath(node).call(print, "value"),
          ]);
        }
        case "Lambda":
          if (node.body.type === "Block") {
            (
              node.body as Extract<PatchedASTNode, { type: "Block" }>
            ).isLambdaBody = true;
          }
          return group([
            "{",
            indent([
              softline,
              group([
                "|",
                indent([
                  softline,
                  join([",", line], typedPath(node).map(print, "args")),
                ]),
                softline,
                "|",
              ]),
              softline,
              path.call(print, "body"),
            ]),
            softline,
            "}",
          ]);
        case "Dict":
          return group([
            "{",
            node.elements.length
              ? [
                  indent([
                    line,
                    join([",", line], path.map(print, "elements")),
                  ]),
                  ifBreak(",", ""),
                  line,
                ]
              : [],
            "}",
          ]);
        case "String":
          return [JSON.stringify(node.value).replaceAll("\\n", "\n")];
        case "Ternary":
          return [
            node.kind === "C" ? [] : "if ",
            path.call(print, "condition"),
            node.kind === "C" ? " ? " : " then ",
            path.call(print, "trueExpression"),
            node.kind === "C" ? " : " : " else ",
            path.call(print, "falseExpression"),
          ];
        case "Void":
          return "()";
        case "UnitValue":
          return [typedPath(node).call(print, "value"), node.unit];
        case "lineComment":
        case "blockComment":
          throw new Error("Didn't expect comment node in print()");
        default:
          throw new Error(`Unsupported node type ${node satisfies never}`);
      }
    },
    printComment: (path: AstPath<ASTCommentNode>) => {
      const commentNode = path.node;
      switch (commentNode.type) {
        case "lineComment":
          // I'm not sure why "hardline" at the end here is not necessary
          return ["//", commentNode.value];
        case "blockComment":
          return ["/*", commentNode.value, "*/"];
        default:
          throw new Error("Unknown comment type");
      }
    },
    isBlockComment: (node) => {
      return node.type === "blockComment";
    },
    ...({
      getCommentChildNodes: (node: ASTNode) => {
        if (!node) {
          return [];
        }
        switch (node.type) {
          case "Program":
            return node.statements;
          case "Block":
            return node.statements;
          case "Array":
            return node.elements;
          case "LetStatement":
            return [node.variable, node.value];
          case "DefunStatement":
            return [node.value];
          case "Call":
            return [...node.args, node.fn];
          case "Dict":
            return node.elements;
          case "Lambda":
            return [...node.args, node.body];
          case "KeyValue":
            return [node.key, node.value];
          default:
            return undefined;
        }
      },
      canAttachComment: (node: ASTNode) => {
        return node && node.type;
      },
    } as any),
  };
}
