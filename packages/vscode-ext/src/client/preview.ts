import * as vscode from "vscode";
import * as path from "path";
import { getWebviewContent } from "./utils";

export const registerPreviewCommand = (context: vscode.ExtensionContext) => {
  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand("squiggle.preview", (editor) => {
      // Create and show a new webview
      const title = `Preview ${path.basename(editor.document.uri.path)}`;

      const panel = vscode.window.createWebviewPanel(
        "squigglePreview",
        title,
        vscode.ViewColumn.Beside,
        {} // Webview options. More on these later.
      );

      panel.webview.options = {
        enableScripts: true,
      };

      panel.webview.html = getWebviewContent({
        context,
        webview: panel.webview,
        title,
        script: "dist/webview/index.js",
      });

      const updateWebview = () => {
        panel.webview.postMessage({
          type: "update",
          text: editor.document.getText(),
          settings: vscode.workspace.getConfiguration("squiggle").preview,
        });
      };

      updateWebview();

      const changeDocumentSubscription =
        vscode.workspace.onDidChangeTextDocument((e) => {
          if (e.document.uri.toString() === editor.document.uri.toString()) {
            updateWebview();
          }
        });

      // Make sure we get rid of the listener when our editor is closed.
      panel.onDidDispose(() => {
        changeDocumentSubscription.dispose();
      });
    })
  );
};
