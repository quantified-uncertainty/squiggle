import { ASTCommentNode, ASTNode, parse } from "@quri/squiggle-lang";
import { AstPath, Parser, Printer, SupportLanguage, doc } from "prettier";

const { group, indent, softline, line, hardline, join } = doc.builders;

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

export const printers: Record<string, Printer<Node>> = {
  "squiggle-ast": {
    print: (path, options, print) => {
      const node = path.getValue();
      switch (node.type) {
        case "Program":
          return join(line, path.map(print, "statements"));
        case "Block":
          if (node.statements.length === 1) {
            return (path as AstPath<Extract<ASTNode, { type: "Block" }>>).call(
              print,
              "statements",
              0
            );
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
            (path as AstPath<Extract<ASTNode, { type: "LetStatement" }>>).call(
              print,
              "value"
            ),
          ]);
        case "Boolean":
          return node.value ? "true" : "false";
        case "Float":
          return String(node.value);
        case "Integer":
          return String(node.value);
        case "Array":
          return join(",", path.map(print, "elements"));
        case "Call":
          return group([
            path.call(print, "fn"),
            "(",
            join(",", path.map(print, "args")),
            ")",
          ]);
        case "Identifier":
          return node.value;
        case "ModuleIdentifier":
          return node.value;
        case "KeyValue":
          return group([
            path.call(print, "key"),
            ":",
            (path as AstPath<Extract<ASTNode, { type: "KeyValue" }>>).call(
              print,
              "value"
            ),
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
          return group(["{", join(",", path.map(print, "elements")), "}"]);
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
      }
    },
    printComment: (path: AstPath<ASTCommentNode>) => {
      const commentNode = path.getValue();
      switch (commentNode.type) {
        case "lineComment":
          return `//${commentNode.value}`;
        case "blockComment":
          return `/*${commentNode.value}*/`;
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
