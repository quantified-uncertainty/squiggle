"use client";
import { ReactElement, ReactNode } from "react";

import type { RelativeValuesTab } from "../state/types.js";
import {
  type CoreProviderProps,
  RelativeValuesCoreProvider,
} from "./host/core.js";
import { PresentationProvider } from "./host/presentation.js";
import type {
  RelativeValuesCustomTab,
  RelativeValuesFrameProps,
  RelativeValuesPresentationProps,
  RelativeValuesSource,
  RelativeValuesStateProps,
} from "./host/types.js";
import {
  CustomTabView,
  RelativeValuesTabView,
} from "./RelativeValuesDashboard.js";
import {
  RelativeValuesRoot,
  useIsInsideRelativeValuesRoot,
} from "./RelativeValuesRoot.js";
import { ViewFallbackProvider } from "./views/ViewStatus.js";

type SingleViewBase<Id extends string> = {
  // A built-in view, or a custom view (like a custom tab).
  view: RelativeValuesTab | RelativeValuesCustomTab<Id>;
  // Shown until this view's pairs are computed; default: the Progress slot.
  fallback?: ReactNode;
} & RelativeValuesPresentationProps &
  RelativeValuesFrameProps;

export type RelativeValuesSingleViewProps<Id extends string = never> =
  | (SingleViewBase<Id> & {
      definition?: never;
      evaluator?: never;
      bundle?: never;
      spec?: never;
    } & { [K in keyof RelativeValuesStateProps]?: never })
  | (SingleViewBase<Id> &
      RelativeValuesSource &
      RelativeValuesStateProps<RelativeValuesTab | NoInfer<Id>>);

const SingleViewFrame = ({
  view,
  fallback,
  className,
  height,
  themeClassName,
}: Pick<
  SingleViewBase<string>,
  "view" | "fallback" | "className" | "height" | "themeClassName"
>): ReactElement => {
  const insideRoot = useIsInsideRelativeValuesRoot();
  const content = (
    <ViewFallbackProvider value={fallback}>
      {typeof view === "string" ? (
        <RelativeValuesTabView tab={view} />
      ) : (
        <CustomTabView tab={view} />
      )}
    </ViewFallbackProvider>
  );
  if (
    insideRoot &&
    className === undefined &&
    height === undefined &&
    themeClassName === undefined
  ) {
    return content;
  }
  return (
    <RelativeValuesRoot
      className={className}
      style={height === undefined ? undefined : { height }}
      themeClassName={themeClassName}
    >
      {height === undefined ? (
        content
      ) : (
        <div className="h-full overflow-auto">{content}</div>
      )}
    </RelativeValuesRoot>
  );
};

/**
 * One view (list, grid, plot or a custom view), with no header or tab bar.
 *
 * With a source (`bundle`, `spec`, or `definition` + `evaluator`) it's
 * standalone: its own provider and state. Without one, it renders from the
 * nearest provider, and takes presentation props only.
 */
export function RelativeValuesSingleView<Id extends string = never>(
  props: RelativeValuesSingleViewProps<Id>
): ReactElement {
  const {
    view,
    fallback,
    className,
    height,
    themeClassName,
    precompute,
    ...rest
  } = props;
  const frame = (
    <SingleViewFrame
      view={view as RelativeValuesTab | RelativeValuesCustomTab<string>}
      fallback={fallback}
      className={className}
      height={height}
      themeClassName={themeClassName}
    />
  );
  const hasSource =
    rest.definition !== undefined ||
    rest.spec !== undefined ||
    "bundle" in rest;
  if (hasSource) {
    const viewId = typeof view === "string" ? view : view.id;
    // The generic view id is erased: views are validated at runtime.
    const coreProps = {
      ...rest,
      views: [viewId],
      precompute,
      defaultPrecompute: true,
    } as unknown as CoreProviderProps;
    return (
      <RelativeValuesCoreProvider {...coreProps}>
        {frame}
      </RelativeValuesCoreProvider>
    );
  }
  const {
    controls,
    components,
    labels,
    format,
    display,
    getPlaygroundUrl,
    linker,
    sourceId,
    onItemClick,
    renderItemName,
    onPairClick,
  } = rest;
  return (
    <PresentationProvider
      controls={controls}
      components={components}
      labels={labels}
      format={format}
      display={display}
      getPlaygroundUrl={getPlaygroundUrl}
      linker={linker}
      sourceId={sourceId}
      onItemClick={onItemClick}
      renderItemName={renderItemName}
      onPairClick={onPairClick}
    >
      {frame}
    </PresentationProvider>
  );
}
