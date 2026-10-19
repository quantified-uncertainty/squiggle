import "./styles.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { WithToasts } from "@quri/ui";

import { App } from "./App.js";

// Additional views (e.g. relative values) can be registered here, before
// rendering, with `registerStudioView` from "./views/index.js".

const container = document.getElementById("root");
if (!container) throw new Error("Missing #root element");

createRoot(container).render(
  <StrictMode>
    <WithToasts>
      <App />
    </WithToasts>
  </StrictMode>
);
