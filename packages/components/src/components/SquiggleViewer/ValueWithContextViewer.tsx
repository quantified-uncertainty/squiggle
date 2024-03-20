// make sure all widgets are in registry
import "../../widgets/index.js";

import { clsx } from "clsx";
import { FC, PropsWithChildren, useCallback, useMemo, useRef } from "react";

import { SqValue } from "@quri/squiggle-lang";
import {
  CodeBracketIcon,
  CommentIcon,
  Dropdown,
  LinkIcon,
  TextTooltip,
} from "@quri/ui";

import { useForceUpdate } from "../../lib/hooks/useForceUpdate.js";
import { MarkdownViewer } from "../../lib/MarkdownViewer.js";
import { SqValueWithContext } from "../../lib/utility.js";
import {
  getSpecificationStatus,
  specificationStatusPreview,
  specificationView,
} from "../../widgets/SpecificationWidget.js";
import { useProjectContext } from "../ProjectProvider.js";
import { ErrorBoundary } from "../ui/ErrorBoundary.js";
import { CollapsedIcon, ExpandedIcon } from "./icons.js";
import { useZoomedInSqValueKeyEvent } from "./keyboardNav/zoomedInSqValue.js";
import { useZoomedOutSqValueKeyEvent } from "./keyboardNav/zoomedOutSqValue.js";
import { SquiggleValueChart } from "./SquiggleValueChart.js";
import { SquiggleValueMenu } from "./SquiggleValueMenu.js";
import { SquiggleValuePreview } from "./SquiggleValuePreview.js";
import {
  getValueComment,
  hasExtraContentToShow,
  pathToShortName,
} from "./utils.js";
import {
  useMergedSettings,
  useRegisterAsItemViewer,
  useRootValueSourceId,
  useScrollToEditorPath,
  useToggleCollapsed,
  useViewerContext,
  useViewerType,
  useZoomIn,
} from "./ViewerProvider.js";

const CommentIconForValue: FC<{ value: SqValueWithContext }> = ({ value }) => {
  const comment = getValueComment(value);

  return comment ? (
    <div className="ml-3">
      <TextTooltip text={comment} placement="bottom">
        <span>
          <CommentIcon
            size={13}
            className="text-purple-100 group-hover:text-purple-300"
          />
        </span>
      </TextTooltip>
    </div>
  ) : null;
};

type Props = {
  value: SqValueWithContext;
  parentValue?: SqValue;
  collapsible?: boolean;
  header?: "normal" | "large" | "hide";
  size?: "normal" | "large";
};

const WithComment: FC<PropsWithChildren<Props>> = ({ value, children }) => {
  const comment = getValueComment(value);

  if (!comment) {
    return children;
  }

  const tagsWithTopPosition = new Set([
    "Dict",
    "Array",
    "TableChart",
    "Plot",
    "String",
  ]);
  const commentPosition = tagsWithTopPosition.has(value.tag) ? "top" : "bottom";

  const commentEl = (
    <div
      className={clsx(
        "max-w-4xl",
        commentPosition === "bottom" ? "mt-1" : "mb-1"
      )}
    >
      <MarkdownViewer md={comment} textSize="sm" />
    </div>
  );

  return (
    // TODO - can be simplified with flex-col-reverse
    <div>
      {commentPosition === "top" && commentEl}
      {children}
      {commentPosition === "bottom" && commentEl}
    </div>
  );
};

const ValueViewerBody: FC<Props> = ({ value, size = "normal" }) => {
  const { path } = value.context;
  const mergedSettings = useMergedSettings(path);
  const adjustedMergedSettings = useMemo(() => {
    const { chartHeight } = mergedSettings;
    return {
      ...mergedSettings,
      chartHeight: size === "large" ? chartHeight * 4 : chartHeight,
    };
  }, [size, mergedSettings]);

  return (
    <WithComment value={value}>
      <SquiggleValueChart value={value} settings={adjustedMergedSettings} />
    </WithComment>
  );
};

export type ValueWithContextViewerHandle = {
  forceUpdate: () => void;
  scrollIntoView: () => void;
  focusOnHeader: () => void;
  toggleCollapsed: () => void;
};

// Note: When called, use a unique ``key``. Otherwise, the initial focus will not always work.
export const ValueWithContextViewer: FC<Props> = ({
  value,
  parentValue,
  ...props
}) => {
  const { tag } = value;
  const { path } = value.context;

  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement | null>(null);
  const { onOpenExport } = useProjectContext();
  const sourceId = useRootValueSourceId();

  const toggleCollapsed_ = useToggleCollapsed();

  // Identity must be stable for the sake of `setHeaderRef` callback
  const focusOnHeader = useCallback(() => {
    headerRef.current?.focus();
  }, []);

  const handle: ValueWithContextViewerHandle = {
    scrollIntoView: () => {
      containerRef?.current?.scrollIntoView({
        behavior: "smooth",
      });
    },
    forceUpdate: useForceUpdate(),
    focusOnHeader,
    toggleCollapsed: () => toggleCollapsed_(path),
  };

  useRegisterAsItemViewer(path, handle);

  const zoomIn = useZoomIn();
  const focus = () => enableFocus && zoomIn(path);
  const focusedKeyEvent = useZoomedInSqValueKeyEvent(path);
  const unfocusedKeyEvent = useZoomedOutSqValueKeyEvent(path);

  const viewerType = useViewerType();
  const scrollEditorToPath = useScrollToEditorPath(path);

  const { itemStore, zoomedInPath } = useViewerContext();
  const isZoomedIn = zoomedInPath?.isEqual(path);
  const itemState = itemStore.getStateOrInitialize(value);

  const isRoot = path.isRoot();
  const taggedName = value.tags.name();

  const exportData = value.tags.exportData();

  const isRootImport =
    exportData &&
    exportData.sourceId !== sourceId &&
    exportData.path.length === 0;

  // root header is always hidden (unless forced, but we probably won't need it)
  const headerVisibility = props.header ?? (isRoot ? "hide" : "show");
  const collapsible =
    headerVisibility === "hide" ? false : props.collapsible ?? true;
  const size = props.size ?? "normal";
  const enableDropdownMenu = viewerType !== "tooltip";
  const enableFocus = viewerType !== "tooltip";

  const specificationStatus = getSpecificationStatus(value);

  // TODO - check that we're not in a situation where `isOpen` is false and `header` is hidden?
  // In that case, the output would look broken (empty).
  const isOpen = !collapsible || !itemState.collapsed;

  const triangleToggle = () => {
    const Icon = itemState.collapsed ? CollapsedIcon : ExpandedIcon;
    const _hasExtraContentToShow = hasExtraContentToShow(value);
    // Only show triangle if there is content to show, that's not in the header.
    if (_hasExtraContentToShow) {
      return (
        <div
          className={clsx(
            "w-4 mr-1.5 flex justify-center cursor-pointer hover:!text-stone-600",
            isOpen ? "text-stone-600 opacity-40" : "text-stone-800 opacity-40"
          )}
          onClick={handle.toggleCollapsed}
        >
          <Icon size={13} />
        </div>
      );
    } else {
      return <div className="w-4 mr-1.5" />;
    }
  };

  const headerName = () => {
    const name = pathToShortName(path);

    // We want to show colons after the keys, for dicts/arrays.
    const showColon =
      headerVisibility !== "large" && path.edges.length > 1 && !isRootImport;

    const getHeaderColor = () => {
      let color = "text-orange-900";
      const parentTag = parentValue?.tag;
      if (isRootImport) {
        color = "text-violet-900";
      } else if (parentTag === "Array" && !taggedName) {
        color = "text-stone-400";
      } else if (path.edges.length > 1) {
        color = "text-teal-700";
      }
      return color;
    };

    const headerColor = getHeaderColor();

    const headerClasses = () => {
      if (headerVisibility === "large") {
        return clsx("text-md font-bold", headerColor);
      } else if (isRoot) {
        return "text-sm text-stone-600 font-semibold";
      } else {
        return clsx(
          "text-sm",
          enableFocus && "cursor-pointer hover:underline",
          headerColor
        );
      }
    };

    return (
      <div
        className={clsx(
          "leading-3 flex flex-row items-center",
          showColon || "mr-3"
        )}
      >
        {isRootImport && (
          <CodeBracketIcon size={12} className="mr-1 text-violet-900" />
        )}
        <div
          className={clsx(!taggedName && "font-mono", headerClasses())}
          onClick={focus}
        >
          {(isRootImport && exportData?.sourceId) || taggedName || name}
        </div>
        {showColon && <div className="text-gray-400 font-mono">:</div>}
      </div>
    );
  };

  const specificationDropdown = () => {
    const specification = value.tags.specification();
    if (specificationStatus.type === "no-specification" || !specification) {
      return null;
    }

    return (
      <Dropdown
        render={() => (
          <div className="px-3 py-2">
            {specificationView(specification, specificationStatus)}
          </div>
        )}
      >
        {specificationStatusPreview(specificationStatus)}
      </Dropdown>
    );
  };

  const leftCollapseBorder = () => {
    const isDictOrList = tag === "Dict" || tag === "Array";
    if (isDictOrList) {
      return (
        <div
          className="group w-4 shrink-0 flex justify-center cursor-pointer"
          onClick={handle.toggleCollapsed}
        >
          <div className="w-px bg-stone-100 group-hover:bg-stone-400" />
        </div>
      );
    } else {
      // Non-root leaf elements have unclickable padding to align with dict/list elements.
      return <div className="flex w-4 min-w-[1rem]" />; // min-w-1rem = w-4
    }
  };

  // Store the header reference for the future `focusOnHeader()` handle, and auto-focus zoomed in values on mount.
  const setHeaderRef = useCallback(
    (el: HTMLElement | null) => {
      headerRef.current = el;

      // If `isZoomedIn` toggles from `false` to `true`, this callback identity will change and it will update the focus.
      if (isZoomedIn) {
        focusOnHeader();
      }
    },
    [isZoomedIn, focusOnHeader]
  );

  return (
    <ErrorBoundary>
      <div ref={containerRef}>
        {headerVisibility !== "hide" && (
          <header
            ref={setHeaderRef}
            tabIndex={viewerType === "tooltip" ? undefined : 0}
            className={clsx(
              "flex justify-between group pr-0.5 hover:bg-stone-100 rounded-sm focus-visible:outline-none",
              isZoomedIn
                ? "focus:bg-indigo-50 mb-2 px-0.5 py-1"
                : "focus:bg-indigo-100"
            )}
            onFocus={(_) => {
              scrollEditorToPath();
            }}
            onKeyDown={(event) => {
              isZoomedIn ? focusedKeyEvent(event) : unfocusedKeyEvent(event);
            }}
          >
            <div className="inline-flex items-center">
              {collapsible && triangleToggle()}
              {headerName()}
              {!isOpen && (
                <div className="text-sm text-blue-800 ml-2">
                  <SquiggleValuePreview value={value} />
                </div>
              )}
              {!isOpen && <CommentIconForValue value={value} />}
            </div>
            <div className="inline-flex space-x-2 items-center">
              {specificationDropdown()}
              {enableDropdownMenu && <SquiggleValueMenu value={value} />}
              {exportData && exportData.path.length < 2 && onOpenExport && (
                <TextTooltip
                  text={
                    `Go to model ${exportData.sourceId}` +
                    (!exportData.path.length
                      ? " page"
                      : ", export " + exportData.path.join("/"))
                  }
                  placement="bottom"
                  offset={5}
                >
                  <div>
                    <LinkIcon
                      size={16}
                      onClick={() =>
                        onOpenExport(
                          exportData.sourceId,
                          exportData.path[0] || undefined
                        )
                      }
                      className={clsx(
                        "transition cursor-pointer",
                        isRootImport
                          ? "text-violet-400 hover:!text-violet-900 group-hover:text-violet-500 group-focus:text-violet-600"
                          : "text-slate-200 hover:!text-slate-900 group-hover:text-slate-400 group-focus:text-slate-400"
                      )}
                    />
                  </div>
                </TextTooltip>
              )}
            </div>
          </header>
        )}
        {isOpen && (
          <div
            className={clsx(
              "flex w-full",
              Boolean(getValueComment(value)) && "py-2"
            )}
          >
            {collapsible && leftCollapseBorder()}
            <div className="grow">
              <ValueViewerBody value={value} size={size} />
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};
