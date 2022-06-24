import {
  createConnection,
  TextDocuments,
  Diagnostic,
  DiagnosticSeverity,
  ProposedFeatures,
  InitializeParams,
  TextDocumentSyncKind,
  InitializeResult,
} from "vscode-languageserver/node";

import { parse } from "@quri/squiggle-lang";

import { TextDocument } from "vscode-languageserver-textdocument";

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
let connection = createConnection(ProposedFeatures.all);

const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

documents.onDidChangeContent((change) => {
  validateSquiggleDocument(change.document);
});

let hasDiagnosticRelatedInformationCapability = false;

connection.onInitialize((params: InitializeParams) => {
  const capabilities = params.capabilities;

  hasDiagnosticRelatedInformationCapability = !!(
    capabilities.textDocument &&
    capabilities.textDocument.publishDiagnostics &&
    capabilities.textDocument.publishDiagnostics.relatedInformation
  );

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
  if (parseResult.tag === "Error") {
    const location = parseResult.value.value[1];
    diagnostics.push({
      severity: DiagnosticSeverity.Error,
      range: {
        start: {
          line: location.start.line - 1,
          character: location.start.column - 1,
        },
        end: {
          line: location.end.line - 1,
          character: location.end.column - 1,
        },
      },
      message: parseResult.value.value[0],
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
