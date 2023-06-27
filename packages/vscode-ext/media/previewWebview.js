(function () {
  const vscode = acquireVsCodeApi();

  const container = document.getElementById("root");

  const root = ReactDOM.createRoot(container);
  function updateContent(text, settings) {
    root.render(
      React.createElement(squiggle_components.SquiggleChart, {
        code: text,
        showHeader: true,
        environment: {
          sampleCount: settings.sampleCount,
          xyPointLength: settings.xyPointLength,
        },
      })
    );
  }

  // Handle messages sent from the extension to the webview
  window.addEventListener("message", (event) => {
    const message = event.data; // The json data that the extension sent
    switch (message.type) {
      case "update":
        const { text, settings } = message;

        // Update our webview's content
        updateContent(text, settings);

        // Then persist state information.
        // This state is returned in the call to `vscode.getState` below when a webview is reloaded.
        vscode.setState({ text, settings });

        return;
    }
  });

  const state = vscode.getState();
  if (state) {
    updateContent(state.text, state.settings);
  }
})();
