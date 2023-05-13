import * as vscode from "vscode";

import { parse, ASTNode } from "@quri/squiggle-lang";

const tokenTypes = ["enum", "function", "variable", "property"];
const tokenModifiers = ["declaration", "documentation"];
const legend = new vscode.SemanticTokensLegend(tokenTypes, tokenModifiers);

const convertRange = (
  range: Extract<ASTNode, { type: "Identifier" }>["location"]
) =>
  new vscode.Range(
    new vscode.Position(range.start.line - 1, range.start.column - 1),
    new vscode.Position(range.end.line - 1, range.end.column - 1)
  );

const populateTokensBuilder = (
  tokensBuilder: vscode.SemanticTokensBuilder,
  node: ASTNode
  // bindings: { [key: string]: boolean }
) => {
  switch (node.type) {
    case "Call":
      populateTokensBuilder(tokensBuilder, node.fn);
      for (const child of node.args) {
        populateTokensBuilder(tokensBuilder, child);
      }
      break;
    case "Block":
      for (const child of node.statements) {
        populateTokensBuilder(tokensBuilder, child);
      }
      break;
    case "LetStatement":
      tokensBuilder.push(
        convertRange(node.variable.location),
        node.value.type === "Lambda" ? "function" : "variable",
        ["declaration"]
      );
      populateTokensBuilder(tokensBuilder, node.value);
      break;
    case "Lambda":
      for (const arg of node.args) {
        populateTokensBuilder(tokensBuilder, arg);
      }
      populateTokensBuilder(tokensBuilder, node.body);
      break;
    case "Ternary":
      populateTokensBuilder(tokensBuilder, node.condition);
      populateTokensBuilder(tokensBuilder, node.trueExpression);
      populateTokensBuilder(tokensBuilder, node.falseExpression);
      break;
    case "KeyValue":
      if (node.key.type === "String" && node.key.location) {
        tokensBuilder.push(convertRange(node.key.location), "property", [
          "declaration",
        ]);
      } else {
        populateTokensBuilder(tokensBuilder, node.key);
      }
      populateTokensBuilder(tokensBuilder, node.value);
      break;
    case "Identifier":
      tokensBuilder.push(convertRange(node.location), "variable");
      break;
  }
};

export const registerSemanticHighlight = () => {
  const provider: vscode.DocumentSemanticTokensProvider = {
    provideDocumentSemanticTokens(
      document: vscode.TextDocument
    ): vscode.ProviderResult<vscode.SemanticTokens> {
      const parseResult = parse(document.getText());

      const tokensBuilder = new vscode.SemanticTokensBuilder(legend);
      if (parseResult.ok) {
        populateTokensBuilder(
          tokensBuilder,
          parseResult.value
          // {}
        );
      }

      return tokensBuilder.build();
    },
  };

  const selector = { language: "squiggle", scheme: "file" };

  vscode.languages.registerDocumentSemanticTokensProvider(
    selector,
    provider,
    legend
  );
};
