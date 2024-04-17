// make sure all widgets are in registry
import "../../../widgets/index.js";

import { clsx } from "clsx";
import { FC, useCallback, useRef } from "react";

import { SqValue } from "@quri/squiggle-lang";
import { CommentIcon, LinkIcon, TextTooltip } from "@quri/ui";

import { useForceUpdate } from "../../../lib/hooks/useForceUpdate.js";
import { SqValueWithContext } from "../../../lib/utility.js";
import { SpecificationDropdown } from "../../../widgets/SpecificationWidget.js";
import { useProjectContext } from "../../ProjectProvider.js";
import { ErrorBoundary } from "../../ui/ErrorBoundary.js";
import { CollapsedIcon, ExpandedIcon } from "../icons.js";
import { useZoomedInSqValueKeyEvent } from "../keyboardNav/zoomedInSqValue.js";
import { useZoomedOutSqValueKeyEvent } from "../keyboardNav/zoomedOutSqValue.js";
import { SquiggleValueMenu } from "../SquiggleValueMenu.js";
import { SquiggleValuePreview } from "../SquiggleValuePreview.js";
import { getValueComment, hasExtraContentToShow } from "../utils.js";
import {
  useRegisterAsItemViewer,
  useRootValueSourceId,
  useScrollToEditorPath,
  useToggleCollapsed,
  useViewerContext,
  useViewerType,
  useZoomIn,
} from "../ViewerProvider.js";
import { Body } from "./Body.js";
import { Title } from "./Title.js";

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
  const { path: valuePath } = value.context;

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
    toggleCollapsed: () => toggleCollapsed_(valuePath),
  };

  useRegisterAsItemViewer(valuePath, handle);

  const zoomIn = useZoomIn();
  const focusedKeyEvent = useZoomedInSqValueKeyEvent(valuePath);
  const unfocusedKeyEvent = useZoomedOutSqValueKeyEvent(valuePath);

  const viewerType = useViewerType();
  const scrollEditorToPath = useScrollToEditorPath(valuePath);

  const { itemStore, zoomedInPath } = useViewerContext();
  const isZoomedIn = zoomedInPath?.isEqual(valuePath);
  const itemState = itemStore.getStateOrInitialize(value);

  const isRoot = valuePath.isRoot();
  const taggedName = value.tags.name();

  const exportData = value.tags.exportData();

  const isRootImport = Boolean(
    exportData &&
      exportData.sourceId !== sourceId &&
      exportData.path.length === 0
  );

  // root header is always hidden (unless forced, but we probably won't need it)
  const headerVisibility = props.header ?? (isRoot ? "hide" : "normal");
  const collapsible =
    headerVisibility === "hide" ? false : props.collapsible ?? true;
  const size = props.size ?? "normal";
  const enableDropdownMenu = viewerType !== "tooltip";

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
            "mr-1.5 flex w-4 cursor-pointer justify-center hover:!text-gray-600",
            isOpen ? "text-gray-200" : "text-gray-500"
          )}
          onClick={handle.toggleCollapsed}
        >
          <Icon size={9} />
        </div>
      );
    } else {
      return <div className="mr-1.5 w-4" />;
    }
  };

  const leftCollapseBorder = () => {
    const isDictOrList = tag === "Dict" || tag === "Array";
    if (isDictOrList) {
      return (
        <div
          className="group flex w-4 shrink-0 cursor-pointer justify-center"
          onClick={handle.toggleCollapsed}
        >
          <div className="w-px bg-gray-50 group-hover:bg-gray-300" />
        </div>
      );
    } else {
      // Non-root leaf elements have unclickable padding to align with dict/list elements.
      return <div className="flex w-4 min-w-[1rem]" />; // min-w-1rem = w-4
    }
  };

  return (
    <ErrorBoundary>
      <div ref={containerRef}>
        {headerVisibility !== "hide" && (
          <header
            ref={(el) => {
              // Store the header reference for the future `focusOnHeader()` handle
              headerRef.current = el;
            }}
            tabIndex={viewerType === "tooltip" ? undefined : 0}
            className={clsx(
              "group flex justify-between rounded-sm pr-0.5 hover:bg-gray-100 focus:bg-slate-100 focus-visible:outline-none",
              isZoomedIn && "mb-2 px-0.5 py-1"
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
              <Title
                {...{
                  valuePath,
                  parentValue,
                  isRootImport,
                  taggedName,
                  viewerType,
                  headerVisibility,
                  isRoot,
                  zoomIn,
                  exportData,
                }}
              />

              {!isOpen && (
                <div className="ml-2 text-sm text-blue-800">
                  <SquiggleValuePreview value={value} />
                </div>
              )}
              {!isOpen && <CommentIconForValue value={value} />}
            </div>
            <div className="inline-flex items-center space-x-2">
              <SpecificationDropdown value={value} />
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
                        "cursor-pointer transition",
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
              <Body value={value} size={size} />
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};
