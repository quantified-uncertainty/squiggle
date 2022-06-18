import * as vscode from "vscode";

function getNonce() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

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
   *
   *
   */
  public async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel
  ): Promise<void> {
    // Setup initial content for the webview
    webviewPanel.webview.options = {
      enableScripts: true,
    };
    webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

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

  /**
   * Get the static html used for the editor webviews.
   */
  private getHtmlForWebview(webview: vscode.Webview): string {
    // Local path to main script run in the webview

    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.context.extensionUri,
        "media/vendor/components.css"
      )
    );

    const scriptUris = [
      // vendor files are copied over by `yarn run compile`
      "media/vendor/react.js",
      "media/vendor/react-dom.js",
      "media/vendor/components.js",
      "media/wysiwyg.js",
    ].map((script) =>
      webview.asWebviewUri(
        vscode.Uri.joinPath(this.context.extensionUri, script)
      )
    );

    // Use a nonce to whitelist which scripts can be run
    const nonce = getNonce();

    return /* html */ `
			<!doctype html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<!--
				Use a content security policy to only allow loading images from https or from our extension directory,
				and only allow scripts that have a specific nonce.
				-->
				<meta http-equiv="Content-Security-Policy" content="script-src 'nonce-${nonce}' 'unsafe-eval';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${styleUri}" rel="stylesheet" />
				<title>Squiggle Editor</title>
			</head>
			<body style="background-color: white; color: black; padding: 12px">
				<div id="root"></div>
        ${scriptUris.map(
          (uri) => `<script nonce="${nonce}" src="${uri}"></script>`
        )}
			</body>
			</html>`;
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
