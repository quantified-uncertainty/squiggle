// based on https://github.com/microsoft/vscode-extension-samples/blob/main/custom-editor-sample/media/catScratch.js
(function () {
  console.log("hello world");
  const vscode = acquireVsCodeApi();

  const container = document.getElementById("root");

  const root = ReactDOM.createRoot(container);
  function updateContent(text) {
    root.render(
      React.createElement(squiggle_components.SquigglePlayground, {
        code: text,
        onCodeChange: (code) => {
          vscode.postMessage({ type: "edit", text: code });
        },
        showEditor: false,
      })
    );
  }

  // Handle messages sent from the extension to the webview
  window.addEventListener("message", (event) => {
    const message = event.data; // The json data that the extension sent
    switch (message.type) {
      case "update":
        const text = message.text;

        // Update our webview's content
        updateContent(text);

        // Then persist state information.
        // This state is returned in the call to `vscode.getState` below when a webview is reloaded.
        vscode.setState({ text });

        return;
    }
  });

  const state = vscode.getState();
  if (state) {
    updateContent(state.text);
  }
})();
