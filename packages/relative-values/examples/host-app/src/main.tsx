import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// The dashboard stylesheet is scoped to the dashboards. Load it before the
// app's own CSS, so that the app's class rules win in custom tabs.
import "@quri/squiggle-relative-values/styles.css";
import "./host.css";

import { App } from "./App.js";

const root = document.getElementById("root");
if (!root) {
  throw new Error("No #root element");
}
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
);
