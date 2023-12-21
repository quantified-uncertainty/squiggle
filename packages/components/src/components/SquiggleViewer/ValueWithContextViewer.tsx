// make sure all widgets are in registry
import "../../widgets/index.js";

import { clsx } from "clsx";
import { FC, PropsWithChildren, useMemo } from "react";
import ReactMarkdown from "react-markdown";

import { CommentIcon, TextTooltip } from "@quri/ui";

import { SqValueWithContext } from "../../lib/utility.js";
import { ErrorBoundary } from "../ErrorBoundary.js";
import { CollapsedIcon, ExpandedIcon } from "./icons.js";
import { SquiggleValueChart } from "./SquiggleValueChart.js";
import { SquiggleValueHeader } from "./SquiggleValueHeader.js";
import { SquiggleValueMenu } from "./SquiggleValueMenu.js";
import { SquiggleValuePreview } from "./SquiggleValuePreview.js";
import { pathToShortName } from "./utils.js";
import {
  useFocus,
  useIsFocused,
  useMergedSettings,
  useRegisterAsItemViewer,
  useToggleCollapsed,
  useViewerContext,
} from "./ViewerProvider.js";

function getComment(value: SqValueWithContext): string | undefined {
  return value.context.docstring() || value.tags.description();
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
        "prose max-w-4xl text-sm text-slate-800 bg-purple-50 bg-opacity-60 py-2 px-3 mb-2 rounded-md",
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

export const ValueWithContextViewer: FC<Props> = ({ value }) => {
  const { tag } = value;
  const { path } = value.context;

  const toggleCollapsed_ = useToggleCollapsed();
  const focus = useFocus();

  const { itemStore } = useViewerContext();
  const itemState = itemStore.getStateOrInitialize(value);

  const isFocused = useIsFocused(path);

  const isRoot = path.isRoot();
  const taggedName = value.tags.name();

  const toggleCollapsed = () => {
    toggleCollapsed_(path);
  };

  const ref = useRegisterAsItemViewer(path);

  const isOpen = isFocused || !itemState.collapsed;
  const _focus = () => !isFocused && !isRoot && focus(path);

  const triangleToggle = () => {
    const Icon = isOpen ? ExpandedIcon : CollapsedIcon;
    return (
      <div
        className="w-4 mr-1.5 flex justify-center cursor-pointer text-stone-300 hover:text-slate-700"
        onClick={toggleCollapsed}
      >
        <Icon size={12} />
      </div>
    );
  };

  const headerClasses = () => {
    if (isFocused) {
      return "text-md text-black font-bold ml-1";
    } else if (isRoot) {
      return "text-sm text-stone-600 font-semibold";
    } else {
      return "text-sm text-stone-800 cursor-pointer hover:underline";
    }
  };

  const name = pathToShortName(path);
  const headerName = (
    <div
      className={clsx(!taggedName && "font-mono", headerClasses())}
      onClick={_focus}
    >
      {taggedName ? taggedName : name}
    </div>
  );

  const leftCollapseBorder = () => {
    const isDictOrList = tag === "Dict" || tag === "Array";
    if (isDictOrList) {
      return (
        <div
          className="group w-4 shrink-0 flex justify-center cursor-pointer"
          onClick={toggleCollapsed}
        >
          <div className="w-px bg-stone-200 group-hover:bg-stone-500" />
        </div>
      );
    } else if (!isRoot) {
      // non-root leaf elements have unclickable padding to align with dict/list elements
      return <div className="flex w-4 min-w-[1rem]" />; // min-w-1rem = w-4
    } else {
      return null;
    }
  };

  return (
    <ErrorBoundary>
      <div ref={ref}>
        <header
          className={clsx(
            "flex justify-between group pr-0.5",
            isFocused ? "mb-2" : "hover:bg-stone-100 rounded-md"
          )}
        >
          <div className="inline-flex items-center">
            {!isFocused && triangleToggle()}
            {headerName}
            {!isFocused && (
              <div
                className={clsx(
                  "ml-3 text-sm text-blue-800",
                  isOpen ? "opacity-40" : "opacity-60"
                )}
              >
                <SquiggleValuePreview value={value} />
              </div>
            )}
            {!isFocused && !isOpen && <CommentIconForValue value={value} />}
          </div>
          <div className="inline-flex space-x-1 items-center">
            {isOpen && <SquiggleValueHeader value={value} />}
            <SquiggleValueMenu value={value} />
          </div>
        </header>
        {isOpen && (
          <div className="flex w-full pt-1">
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
