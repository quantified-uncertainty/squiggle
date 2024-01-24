import { ReactNode } from "react";
import { createRoot } from "react-dom/client";

export function reactAsDom(node: ReactNode): { dom: HTMLDivElement } {
  const dom = document.createElement("div");
  const root = createRoot(dom);
  root.render(node);
  // This is compatible with `CompletionInfo` and `TooltipView` CodeMirror types
  return { dom };
}
