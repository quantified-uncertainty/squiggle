import {
  EditorState,
  Extension,
  Facet,
  TransactionSpec,
} from "@codemirror/state";
import { ReactNode } from "react";
import { createRoot } from "react-dom/client";

export function reactAsDom(node: ReactNode): { dom: HTMLDivElement } {
  const dom = document.createElement("div");
  const root = createRoot(dom);
  root.render(node);
  // This is compatible with `CompletionInfo` and `TooltipView` CodeMirror types
  return { dom };
}

/**
 * This function produces an extension that will dispatch a transaction when any of given facets change their value.
 *
 * It's useful to reconfigure a compartment on facet changes, e.g. when the facet comes from React props.
 */
export function dispatchOnFacetsChange<T extends unknown[]>(
  action: (
    values: T
  ) => Pick<TransactionSpec, "effects" | "annotations"> | null,
  facets: { [Index in keyof T]: Facet<T[Index], unknown> }
): Extension {
  return EditorState.transactionExtender.of((tr) => {
    const values: T = [] as unknown as T;
    let changed = false;
    for (const facet of facets) {
      const prevValue = tr.startState.facet(facet);
      const value = tr.state.facet(facet);
      if (prevValue !== value) changed = true;
      values.push(value);
    }
    if (!changed) {
      return null;
    }
    return action(values);
  });
}
