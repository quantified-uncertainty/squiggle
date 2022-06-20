import * as vscode from "vscode";
import { getWebviewContent } from "./utils";

export class SquiggleEditorProvider implements vscode.CustomTextEditorProvider {
  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    const provider = new SquiggleEditorProvider(context);
    const providerRegistration = vscode.window.registerCustomEditorProvider(
      SquiggleEditorProvider.viewType,
      provider
    );
    return providerRegistration;
  }

  private static readonly viewType = "squiggle.wysiwyg";

  constructor(private readonly context: vscode.ExtensionContext) {}

  /**
   * Called when our custom editor is opened.
   */
  public async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel
  ): Promise<void> {
    // Setup initial content for the webview
    webviewPanel.webview.options = {
      enableScripts: true,
    };
    webviewPanel.webview.html = getWebviewContent({
      webview: webviewPanel.webview,
      script: "media/wysiwygWebview.js",
      title: "Squiggle Editor",
      context: this.context,
    });

    function updateWebview() {
      webviewPanel.webview.postMessage({
        type: "update",
        text: document.getText(),
      });
    }

    // Hook up event handlers so that we can synchronize the webview with the text document.
    //
    // The text document acts as our model, so we have to sync change in the document to our
    // editor and sync changes in the editor back to the document.
    //
    // Remember that a single text document can also be shared between multiple custom
    // editors (this happens for example when you split a custom editor)

    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(
      (e) => {
        if (e.document.uri.toString() === document.uri.toString()) {
          updateWebview();
        }
      }
    );

    // Make sure we get rid of the listener when our editor is closed.
    webviewPanel.onDidDispose(() => {
      changeDocumentSubscription.dispose();
    });

    // Receive message from the webview.
    webviewPanel.webview.onDidReceiveMessage((e) => {
      switch (e.type) {
        case "edit":
          this.updateTextDocument(document, e.text);
          return;
      }
    });

    updateWebview();
  }

  private updateTextDocument(document: vscode.TextDocument, text: string) {
    const edit = new vscode.WorkspaceEdit();

    // Just replace the entire document every time.
    edit.replace(
      document.uri,
      new vscode.Range(0, 0, document.lineCount, 0),
      text
    );

    return vscode.workspace.applyEdit(edit);
  }
}
