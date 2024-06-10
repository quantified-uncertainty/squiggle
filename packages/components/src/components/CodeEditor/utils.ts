import {
  Compartment,
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

/**
 * Creates an extension with dynamic configuration based on a list of facets.
 *
 * Whenever the facet values change, the extension will be reconfigured.
 *
 * Note that this function creates a new anonymous compartment every time it's called, so you should call it just once during the initial configuration.
 */
export function extensionFromFacets<T extends unknown[]>({
  facets,
  makeExtension,
  initialValues,
}: {
  facets: { [Index in keyof T]: Facet<T[Index], unknown> };
  makeExtension: (values: T) => Extension;
  initialValues: T;
}) {
  const compartment = new Compartment();

  return [
    dispatchOnFacetsChange<T>(
      (values) => ({
        effects: compartment.reconfigure(makeExtension(values)),
      }),
      facets
    ),
    compartment.of(makeExtension(initialValues)),
  ];
}
