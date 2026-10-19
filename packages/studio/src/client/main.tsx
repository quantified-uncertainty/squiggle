import "./styles.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { WithToasts } from "@quri/ui";

import { App } from "./App.js";
import { CommandsProvider } from "./commands/registry.js";

// Built-in views (Output, Relative values, Playground) are defined in
// ./views/index.tsx. Additional views can be registered here, before
// rendering, with `registerStudioView` from "./views/index.js".

const container = document.getElementById("root");
if (!container) throw new Error("Missing #root element");

createRoot(container).render(
  <StrictMode>
    <WithToasts>
      <CommandsProvider>
        <App />
      </CommandsProvider>
    </WithToasts>
  </StrictMode>
);
