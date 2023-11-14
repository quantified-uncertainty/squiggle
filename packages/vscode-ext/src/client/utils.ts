import * as vscode from "vscode";

const getNonce = () => {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

export const getWebviewContent = ({
  webview,
  title,
  script,
  context,
}: {
  webview: vscode.Webview;
  title: string;
  script: string;
  context: vscode.ExtensionContext;
}) => {
  const nonce = getNonce();

  const styleUri = webview.asWebviewUri(
    vscode.Uri.joinPath(context.extensionUri, "dist/media/components.css")
  );

  const scriptUris = [script].map((script) =>
    webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, script))
  );

  return `
    <!doctype html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <!-- Use a content security policy to only allow scripts that have a specific nonce.  -->
        <meta http-equiv="Content-Security-Policy" content="script-src 'nonce-${nonce}' 'unsafe-eval';">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${styleUri}" rel="stylesheet" />
        <title>${title}</title>
    </head>
    <body style="background-color: white; color: black; padding: 8px 12px">
        <div id="root"></div>
        ${scriptUris
          .map((uri) => `<script nonce="${nonce}" src="${uri}"></script>`)
          .join("")}
    </body>
    </html>
  `;
};
