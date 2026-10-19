"use client";
import clsx from "clsx";
import { CSSProperties, FC, PropsWithChildren } from "react";

import { TailwindContext } from "@quri/ui";

/**
 * Class name that scopes `@quri/squiggle-relative-values/styles.css`: its
 * rules only apply inside elements with this class.
 */
export const RELATIVE_VALUES_CSS_SCOPE = "squiggle-rv";

const tailwindContextValue = { selector: RELATIVE_VALUES_CSS_SCOPE };

/**
 * Wrapper for the scoped stylesheet (`styles.css`). Dashboards render it
 * themselves; use it directly if you compose `RelativeValuesProvider` with
 * individual views.
 *
 * Dropdowns and tooltips are rendered in portals outside of this element;
 * they get their own wrapper through `@quri/ui`'s `TailwindContext`.
 */
export const RelativeValuesRoot: FC<
  PropsWithChildren<{
    // Applied to the wrapper element, e.g. for margins or borders.
    className?: string;
    style?: CSSProperties;
  }>
> = ({ className, style, children }) => (
  <TailwindContext.Provider value={tailwindContextValue}>
    <div className={clsx(RELATIVE_VALUES_CSS_SCOPE, className)} style={style}>
      {children}
    </div>
  </TailwindContext.Provider>
);
