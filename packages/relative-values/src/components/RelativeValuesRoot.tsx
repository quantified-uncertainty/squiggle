"use client";
import clsx from "clsx";
import {
  createContext,
  CSSProperties,
  FC,
  PropsWithChildren,
  useContext,
  useMemo,
} from "react";

import { TailwindContext } from "@quri/ui";

import { useOptionalCore } from "./host/core.js";
import { usePresentation } from "./host/presentation.js";

/**
 * Class name that scopes `@quri/squiggle-relative-values/styles.css`: its
 * rules only apply inside elements with this class.
 */
export const RELATIVE_VALUES_CSS_SCOPE = "squiggle-rv";

// Class of the root (and portals) in compact density.
export const RELATIVE_VALUES_COMPACT_CLASS = "squiggle-rv-compact";

const RootContext = createContext(false);

/** Whether this is inside a `RelativeValuesRoot`. */
export function useIsInsideRelativeValuesRoot(): boolean {
  return useContext(RootContext);
}

/**
 * Wrapper for the scoped stylesheet (`styles.css`). Dashboards and single
 * views render it themselves; wrap other pieces (views, controls) that you
 * place under `RelativeValuesProvider` in it.
 *
 * Dropdowns and tooltips are rendered in portals outside of this element;
 * they get their own wrapper (with `themeClassName` and the density class)
 * through `@quri/ui`'s `TailwindContext`.
 *
 * Inside a provider, it carries `data-rv-ready` once every mounted view's
 * pairs are computed.
 */
export const RelativeValuesRoot: FC<
  PropsWithChildren<{
    // Applied to the wrapper element, e.g. for margins or borders.
    className?: string;
    style?: CSSProperties;
    // Applied to the wrapper and to dropdown and tooltip portals, e.g. to set
    // CSS variables.
    themeClassName?: string;
    // Defaults to `display.density` of the enclosing provider.
    density?: "comfortable" | "compact";
  }>
> = ({ className, style, themeClassName, density, children }) => {
  const core = useOptionalCore();
  const presentation = usePresentation();
  const compact = (density ?? presentation.display.density) === "compact";
  const selector = clsx(
    RELATIVE_VALUES_CSS_SCOPE,
    themeClassName,
    compact && RELATIVE_VALUES_COMPACT_CLASS
  );
  const tailwindContextValue = useMemo(() => ({ selector }), [selector]);
  return (
    <TailwindContext.Provider value={tailwindContextValue}>
      <RootContext.Provider value={true}>
        <div
          className={clsx(selector, className)}
          style={style}
          data-rv-ready={core?.allReady ? "" : undefined}
        >
          {children}
        </div>
      </RootContext.Provider>
    </TailwindContext.Provider>
  );
};
