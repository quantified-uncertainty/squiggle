// make sure all widgets are in registry
import "../../widgets/index.js";

import { clsx } from "clsx";
import { FC, PropsWithChildren, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";

import { SqValue } from "@quri/squiggle-lang";
import { CommentIcon, TextTooltip } from "@quri/ui";

import { SHORT_STRING_LENGTH } from "../../lib/constants.js";
import { SqValueWithContext } from "../../lib/utility.js";
import { ErrorBoundary } from "../ErrorBoundary.js";
import { CollapsedIcon, ExpandedIcon } from "./icons.js";
import { SquiggleValueChart } from "./SquiggleValueChart.js";
import { SquiggleValueMenu } from "./SquiggleValueMenu.js";
import { SquiggleValuePreview } from "./SquiggleValuePreview.js";
import { getChildrenValues, pathToShortName } from "./utils.js";
import {
  useCollapseChildren,
  useFocus,
  useIsFocused,
  useMergedSettings,
  useRegisterAsItemViewer,
  useSetCollapsed,
  useToggleCollapsed,
  useViewerContext,
} from "./ViewerProvider.js";

function getComment(value: SqValueWithContext): string | undefined {
  const boxedDescription =
    value.tag === "Boxed" ? value.value.description() : undefined;
  return value.context.docstring() || boxedDescription;
}

const CommentIconForValue: FC<{ value: SqValueWithContext }> = ({ value }) => {
  const comment = getComment(value);

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
};

const WithComment: FC<PropsWithChildren<Props>> = ({ value, children }) => {
  const comment = getComment(value);

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
    <ReactMarkdown
      className={clsx(
        "prose max-w-4xl text-sm text-slate-800 py-2 px-3 mb-2",
        commentPosition === "bottom" && "mt-2"
      )}
    >
      {comment}
    </ReactMarkdown>
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

const ValueViewerBody: FC<Props> = ({ value }) => {
  const { path } = value.context;
  const isFocused = useIsFocused(path);
  const isRoot = path.isRoot();

  const mergedSettings = useMergedSettings(path);
  const adjustedMergedSettings = useMemo(() => {
    const { chartHeight } = mergedSettings;
    return {
      ...mergedSettings,
      chartHeight: isFocused || isRoot ? chartHeight * 4 : chartHeight,
    };
  }, [isFocused, isRoot, mergedSettings]);

  return (
    <WithComment value={value}>
      <SquiggleValueChart value={value} settings={adjustedMergedSettings} />
    </WithComment>
  );
};

const tagsDefaultCollapsed = new Set(["Bool", "Number", "Void", "Input"]);

function hasExtraContentToShow(v: SqValueWithContext): boolean {
  return !(
    tagsDefaultCollapsed.has(v.tag) ||
    (v.tag === "String" && v.value.length <= SHORT_STRING_LENGTH)
  );
}

export const ValueWithContextViewer: FC<Props> = ({ value, parentValue }) => {
  const { tag } = value;
  const { path } = value.context;

  const toggleCollapsed_ = useToggleCollapsed();
  const setCollapsed = useSetCollapsed();
  const collapseChildren = useCollapseChildren();
  const focus = useFocus();
  const { getLocalItemState } = useViewerContext();
  const isFocused = useIsFocused(path);

  const isRoot = path.isRoot();
  const boxedName = tag === "Boxed" ? value.value.name() : undefined;

  // Collapse children and element if desired. Uses crude heuristics.
  // TODO - this code has side effects, it'd be better if we ran it somewhere else, e.g. traverse values recursively when `ViewerProvider` is initialized.
  useState(() => {
    const shouldBeginCollapsed = (
      isRoot: boolean,
      v: SqValueWithContext
    ): boolean => {
      if (isRoot) {
        return getChildrenValues(v).length > 30;
      } else {
        return getChildrenValues(v).length > 5 || !hasExtraContentToShow(v);
      }
    };

    if (getChildrenValues(value).length > 10) {
      collapseChildren(value);
    }
    if (shouldBeginCollapsed(isRoot, value)) {
      setCollapsed(path, true);
    }
  });

  const toggleCollapsed = () => {
    toggleCollapsed_(path);
  };

  const ref = useRegisterAsItemViewer(path);

  const isOpen = isFocused || !getLocalItemState({ path }).collapsed;
  const _focus = () => !isFocused && !isRoot && focus(path);

  const triangleToggle = () => {
    const Icon = isOpen ? ExpandedIcon : CollapsedIcon;
    const _hasExtraContentToShow = hasExtraContentToShow(value);
    if (_hasExtraContentToShow) {
      return (
        <div
          className="w-4 mr-1.5 flex justify-center cursor-pointer text-stone-200 hover:!text-stone-600 group-hover:text-stone-300"
          onClick={toggleCollapsed}
        >
          <Icon size={12} />
        </div>
      );
    } else {
      return <div className="w-4 mr-1.5" />;
    }
  };

  const headerClasses = () => {
    let mainColor = "text-orange-900";
    const parentTag = parentValue?.tag;
    if (parentTag === "Array") {
      mainColor = "text-stone-400";
    } else if (path.items.length > 1) {
      mainColor = "text-teal-700";
    }
    if (isFocused) {
      return clsx("text-md font-bold ml-1", mainColor);
    } else if (isRoot) {
      return "text-sm text-stone-600 font-semibold";
    } else {
      return clsx("text-sm cursor-pointer hover:underline", mainColor);
    }
  };

  const isWeird = !isFocused && path.items.length > 1;
  const name = pathToShortName(path);
  const headerName = (
    <div
      className={clsx(!boxedName && "font-mono", headerClasses())}
      onClick={_focus}
    >
      {boxedName ? boxedName : name}
      {isWeird && <span className="text-stone-400">:</span>}
    </div>
  );

  const leftCollapseBorder = () => {
    if (isRoot) {
      return null;
    }
    const isDictOrList = tag === "Dict" || tag === "Array";
    if (isDictOrList) {
      return (
        <div
          className="group w-4 shrink-0 flex justify-center cursor-pointer"
          onClick={toggleCollapsed}
        >
          <div className="w-px bg-stone-100 group-hover:bg-stone-400" />
        </div>
      );
    } else {
      // non-root leaf elements have unclickable padding to align with dict/list elements
      return <div className="flex w-4 min-w-[1rem]" />; // min-w-1rem = w-4
    }
  };

  return (
    <ErrorBoundary>
      <div ref={ref} className={clsx(isFocused && "px-2")}>
        <header
          className={clsx(
            "flex justify-between group pr-0.5",
            isFocused ? "mb-2" : "hover:bg-stone-100 rounded-sm"
          )}
        >
          <div className="inline-flex items-center">
            {!isFocused && triangleToggle()}
            {headerName}
            {!isFocused && !isOpen && (
              <div
                className={clsx(
                  "text-sm text-blue-800",
                  isWeird ? "ml-2" : "ml-5"
                )}
              >
                <SquiggleValuePreview value={value} />
              </div>
            )}
            {!isFocused && !isOpen && <CommentIconForValue value={value} />}
          </div>
          <div className="inline-flex space-x-1 items-center">
            <SquiggleValueMenu value={value} />
          </div>
        </header>
        {isOpen && (
          <div className="flex w-full">
            {!isFocused && leftCollapseBorder()}
            <div className="grow">
              <ValueViewerBody value={value} />
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};
