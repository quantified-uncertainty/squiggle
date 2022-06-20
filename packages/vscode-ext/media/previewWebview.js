(function () {
  const vscode = acquireVsCodeApi();

  const container = document.getElementById("root");

  const root = ReactDOM.createRoot(container);
  function updateContent(text, showSettings) {
    root.render(
      React.createElement(squiggle_components.SquigglePlayground, {
        code: text,
        showEditor: false,
        showTypes: Boolean(showSettings.showTypes),
        showControls: Boolean(showSettings.showControls),
        showSummary: Boolean(showSettings.showSummary),
      })
    );
  }

  // Handle messages sent from the extension to the webview
  window.addEventListener("message", (event) => {
    const message = event.data; // The json data that the extension sent
    switch (message.type) {
      case "update":
        const { text, showSettings } = message;

        // Update our webview's content
        updateContent(text, showSettings);

        // Then persist state information.
        // This state is returned in the call to `vscode.getState` below when a webview is reloaded.
        vscode.setState({ text, showSettings });

        return;
    }
  });

  const state = vscode.getState();
  if (state) {
    updateContent(state.text, state.showSettings);
  }
})();
