"use client";
import clsx from "clsx";
import {
  ComponentType,
  createElement,
  FC,
  PropsWithChildren,
  ReactElement,
  useEffect,
  useState,
} from "react";

import { StyledTab } from "@quri/ui";

import { usePresentation } from "./presentation.js";
import type {
  RelativeValuesEmptyProps,
  RelativeValuesErrorProps,
  RelativeValuesProgressProps,
  RelativeValuesSlot,
  RelativeValuesTabBarProps,
  RelativeValuesToolbarProps,
} from "./types.js";

/** Renders a slot (with `Default`), or the default implementation. */
export function renderSlot<P extends object>(
  slot: RelativeValuesSlot<P> | undefined,
  Default: ComponentType<P>,
  props: P
): ReactElement {
  return slot
    ? createElement(slot, { ...props, Default })
    : createElement(Default, props);
}

export const DefaultTabBar: FC<RelativeValuesTabBarProps> = ({
  tabs,
  active,
  onChange,
}) => (
  <div data-rv-part="tab-bar">
    <StyledTab.ListDiv>
      {tabs.map(({ id, label, icon }) => (
        <button
          key={id}
          type="button"
          className={clsx(
            "flex rounded-md",
            active === id &&
              "shadow-[inset_0_-2px_0_var(--squiggle-rv-accent,transparent)]"
          )}
          data-rv-tab={id}
          aria-pressed={active === id}
          onClick={() => onChange(id)}
        >
          <StyledTab.Button
            name={label}
            icon={icon}
            isSelected={active === id}
          />
        </button>
      ))}
    </StyledTab.ListDiv>
  </div>
);

// `children` is the built-in toolbar.
export const DefaultToolbar: FC<RelativeValuesToolbarProps> = ({
  children,
}) => <>{children}</>;

/**
 * Progress of the computation of pairs. Marked with `data-rv-computing`, so
 * that tests and screenshot tools can wait for it to disappear.
 */
export const DefaultProgress: FC<RelativeValuesProgressProps> = ({
  progress,
  variant,
}) => {
  const { labels, format } = usePresentation();
  const compact = variant === "compact";
  // Don't flash the full progress bar for quick computations.
  const [visible, setVisible] = useState(compact);
  useEffect(() => {
    const timeout = setTimeout(() => setVisible(true), 150);
    return () => clearTimeout(timeout);
  }, []);
  const fraction =
    progress && progress.total > 0 ? progress.done / progress.total : 0;
  return (
    <div
      data-rv-computing=""
      data-rv-part="progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={progress?.total ?? 0}
      aria-valuenow={progress?.done ?? 0}
      aria-label={labels["progress.aria"]}
      className={clsx(
        "flex flex-col gap-1.5",
        compact ? "w-32" : "mx-auto w-full max-w-sm py-16",
        !visible && "invisible"
      )}
    >
      <div
        className={clsx(
          "flex justify-between gap-2 text-[color:var(--squiggle-rv-muted,#64748b)]",
          compact ? "text-xs" : "text-sm"
        )}
      >
        <span>
          {compact
            ? labels["progress.computingShort"]
            : labels["progress.computing"]}
        </span>
        {progress && (
          <span className="tabular-nums">
            {compact
              ? `${Math.floor(fraction * 100)}%`
              : `${progress.done.toLocaleString(format.locale)} / ${progress.total.toLocaleString(format.locale)}`}
          </span>
        )}
      </div>
      <div
        className={clsx(
          "overflow-hidden rounded-full bg-slate-200",
          compact ? "h-1" : "h-1.5"
        )}
      >
        <div
          className="h-full rounded-full bg-[var(--squiggle-rv-accent,#64748b)] transition-[width]"
          style={{ width: `${fraction * 100}%` }}
        />
      </div>
    </div>
  );
};

export const DefaultEmpty: FC<RelativeValuesEmptyProps> = ({ reason }) => {
  const { labels } = usePresentation();
  return (
    <div
      data-rv-part="empty"
      className="py-8 text-center text-sm text-[color:var(--squiggle-rv-muted,#64748b)]"
    >
      {reason === "scope" ? labels["empty.scope"] : labels["empty.filter"]}
    </div>
  );
};

export const DefaultError: FC<RelativeValuesErrorProps> = ({ error }) => (
  <pre className="whitespace-pre-wrap text-sm text-red-700">{error}</pre>
);

// The toolbar row of a view, through the `Toolbar` slot.
export const ViewToolbar: FC<
  PropsWithChildren<{
    view: RelativeValuesToolbarProps["view"];
    className?: string;
  }>
> = ({ view, className, children }) => {
  const { components } = usePresentation();
  return renderSlot(components.Toolbar, DefaultToolbar, {
    view,
    children: (
      <div data-rv-part="toolbar" className={className}>
        {children}
      </div>
    ),
  });
};
