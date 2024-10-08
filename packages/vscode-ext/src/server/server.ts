import { TextDocument } from "vscode-languageserver-textdocument";
import {
  createConnection,
  Diagnostic,
  DiagnosticSeverity,
  InitializeParams,
  InitializeResult,
  ProposedFeatures,
  TextDocuments,
  TextDocumentSyncKind,
} from "vscode-languageserver/node";

import { parse } from "@quri/squiggle-lang";

// Documentation:
// - https://code.visualstudio.com/api/language-extensions/language-server-extension-guide
// - https://microsoft.github.io/language-server-protocol/specifications/specification-current

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all);

const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

documents.onDidChangeContent((change) => {
  validateSquiggleDocument(change.document);
});

connection.onInitialize((params: InitializeParams) => {
  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
    },
  };
  return result;
});

async function validateSquiggleDocument(
  textDocument: TextDocument
): Promise<void> {
  const text = textDocument.getText();

  const diagnostics: Diagnostic[] = [];

  const parseResult = parse(text);
  if (!parseResult.ok) {
    parseResult.value.forEach((error) => {
      diagnostics.push({
        severity: DiagnosticSeverity.Error,
        range: {
          start: {
            line: error.location().start.line - 1,
            character: error.location().start.column - 1,
          },
          end: {
            line: error.location().end.line - 1,
            character: error.location().end.column - 1,
          },
        },
        message: parseResult.value.toString(),
      });
    });
  }

  // Send the computed diagnostics to VSCode.
  connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
