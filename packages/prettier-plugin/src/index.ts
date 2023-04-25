import { ASTCommentNode, ASTNode, parse } from "@quri/squiggle-lang";
import {
  AstPath,
  Doc,
  Parser,
  Printer,
  SupportLanguage,
  doc,
  util,
} from "prettier";

const { group, indent, softline, line, hardline, join, ifBreak } = doc.builders;

export const languages: SupportLanguage[] = [
  {
    name: "Squiggle",
    parsers: ["squiggle"],
    extensions: [".squiggle"],
  },
];

type Node = ASTNode | ASTCommentNode;

export const parsers: Record<string, Parser<Node>> = {
  squiggle: {
    parse: (text) => {
      const parseResult = parse(text);
      if (!parseResult.ok) {
        throw new Error(`Parse failed. ${parseResult.value}`);
      }
      // console.log(JSON.stringify(parseResult.value, null, 2));
      return parseResult.value;
    },
    astFormat: "squiggle-ast",
    locStart: (node: Node) => {
      return node.location.start.offset;
    },
    locEnd: (node: Node) => {
      return node.location.end.offset;
    },
  },
};

function parenthesizeIfNecessary(doc: Doc, node: Node): Doc {
  let needParens = false;
  if (node.type === "InfixCall") {
    needParens = true;
  }
  // TODO - ternary
  // TODO - take parent's precedence into account

  return needParens ? ["(", doc, ")"] : doc;
}

export const printers: Record<string, Printer<Node>> = {
  "squiggle-ast": {
    print: (path, options, print) => {
      const node = path.getValue();
      const typedPath = <T extends ASTNode["type"]>(
        _: Extract<ASTNode, { type: T }>
      ) => {
        return path as AstPath<Extract<ASTNode, { type: T }>>;
      };

      switch (node.type) {
        case "Program":
          return path.map(print, "statements");
        case "Block":
          if (node.statements.length === 1) {
            return typedPath(node).call(print, "statements", 0);
          }
          return group([
            "{",
            indent([line, join(hardline, path.map(print, "statements"))]),
            line,
            "}",
          ]);
        case "LetStatement":
          return group([
            node.variable.value,
            " = ",
            typedPath(node).call(print, "value"),
            hardline,
            util.isNextLineEmptyAfterIndex(
              options.originalText,
              node.location.end.offset
            )
              ? hardline
              : "",
          ]);
        case "Boolean":
          return node.value ? "true" : "false";
        case "Float":
          return String(node.value);
        case "Integer":
          return String(node.value);
        case "Array":
          return group([
            "[",
            indent([softline, join([",", line], path.map(print, "elements"))]),
            ifBreak(",", ""),
            softline,
            "]",
          ]);
        case "Call":
          return group([
            typedPath(node).call(print, "fn"),
            "(",
            indent([softline, join([",", line], path.map(print, "args"))]),
            softline,
            ")",
          ]);
        case "InfixCall":
          const args = ([0, 1] as const).map((i) =>
            parenthesizeIfNecessary(
              typedPath(node).call(print, "args", i),
              node.args[i]
            )
          );

          // TODO - make parens optional
          return group([args[0], " ", node.op, line, args[1]]);
        case "UnaryCall":
          // TODO - make parens optional
          return group([
            node.op,
            parenthesizeIfNecessary(
              typedPath(node).call(print, "arg"),
              node.arg
            ),
          ]);
        case "DotLookup":
          return group([
            "(",
            typedPath(node).call(print, "arg"),
            ")",
            ".",
            node.key,
          ]);
        case "BracketLookup":
          return group([
            "(",
            typedPath(node).call(print, "arg"),
            ")",
            "[",
            typedPath(node).call(print, "key"),
            "]",
          ]);
        case "Identifier":
          return node.value;
        case "ModuleIdentifier":
          return node.value;
        case "KeyValue":
          return group([
            typedPath(node).call(print, "key"),
            ":",
            line,
            typedPath(node).call(print, "value"),
          ]);
        case "Lambda":
          return group([
            "{|",
            join(",", path.map(print, "args")),
            "|",
            path.call(print, "body"),
            "}",
          ]);
        case "Record":
          return group([
            "{",
            indent([line, join([",", line], path.map(print, "elements"))]),
            ifBreak(",", ""),
            line,
            "}",
          ]);
        case "String":
          return ['"', node.value, '"'];
        case "Ternary":
          return [
            path.call(print, "condition"),
            " ? ",
            path.call(print, "trueExpression"),
            " : ",
            path.call(print, "falseExpression"),
          ];
        case "Void":
          return "()";
        case "lineComment":
        case "blockComment":
          throw new Error("Didn't expect comment node in print()");
        default:
          throw new Error(`Unsupported node type ${node satisfies never}`);
      }
    },
    printComment: (path: AstPath<ASTCommentNode>) => {
      const commentNode = path.getValue();
      switch (commentNode.type) {
        case "lineComment":
          return ["//", commentNode.value, hardline];
        case "blockComment":
          return ["/*", commentNode.value, "*/"];
        default:
          throw new Error("Unknown comment type");
      }
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
          case "Call":
            return [...node.args, node.fn];
          case "Record":
            return node.elements;
          case "KeyValue":
            return [node.key, node.value];
          default:
            return [];
        }
      },
      canAttachComment: (node: ASTNode) => {
        return node && node.type;
      },
    } as any),
  },
};

export const options = {};
export const defaultOptions = {};
