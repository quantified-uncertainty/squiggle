import * as React from "react";
import * as ReactDOM from "react-dom/client";

import { SquiggleChart } from "@quri/squiggle-components";
import { Env } from "@quri/squiggle-lang";

const container = document.getElementById("root")!;
const root = ReactDOM.createRoot(container);

const vscode = acquireVsCodeApi();

function updateContent(text: string, settings: Env) {
  root.render(
    <SquiggleChart
      code={text}
      showHeader
      environment={{
        sampleCount: settings.sampleCount,
        xyPointLength: settings.xyPointLength,
      }}
    />
  );
}

// Handle messages sent from the extension to the webview
window.addEventListener("message", (event) => {
  const message = event.data; // The json data that the extension sent
  switch (message.type) {
    case "update": {
      const { text, settings } = message;

      // Update our webview's content
      updateContent(text, settings);

      // Then persist state information.
      // This state is returned in the call to `vscode.getState` below when a webview is reloaded.
      vscode.setState({ text, settings });

      return;
    }
  }
});

const state = vscode.getState() as { text: string; settings: Env } | undefined;
if (state) {
  updateContent(state.text, state.settings);
}
