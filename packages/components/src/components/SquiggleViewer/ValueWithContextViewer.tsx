import { clsx } from "clsx";
import {
  FC,
  PropsWithChildren,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ReactMarkdown from "react-markdown";

import { CommentIcon, TextTooltip, TriangleIcon } from "@quri/ui";

import { useForceUpdate } from "../../lib/hooks/index.js";
import { SqValueWithContext } from "../../lib/utility.js";
import { ErrorBoundary } from "../ErrorBoundary.js";
import { SquiggleValueChart } from "./SquiggleValueChart.js";
import { SquiggleValueHeader } from "./SquiggleValueHeader.js";
import { SquiggleValuePreview } from "./SquiggleValuePreview.js";
import { SquiggleValueSettingsMenu } from "./SquiggleValueSettingsMenu.js";
import {
  useCollapseChildren,
  useFocus,
  useIsFocused,
  useMergedSettings,
  useSetCollapsed,
  useToggleCollapsed,
  useViewerContext,
} from "./ViewerProvider.js";
import { getChildrenValues, pathToShortName } from "./utils.js";

// make sure all widgets are in registry
import "../../widgets/index.js";

function getComment(value: SqValueWithContext): string | undefined {
  return value.context.docstring();
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
  const setCollapsed = useSetCollapsed();
  const collapseChildren = useCollapseChildren();
  const focus = useFocus();
  const { getLocalItemState, dispatch } = useViewerContext();
  const isFocused = useIsFocused(path);

  /**
   * Since `ViewerContext` doesn't store settings, this component won't rerender when `setSettings` is called.
   * So we use `forceUpdate` to force rerendering.
   * (This function is not used directly in this component. Instead, it's passed to `<ViewerProvider>` to be called when necessary, sometimes from other components.)
   */
  const forceUpdate = useForceUpdate();

  const isRoot = path.isRoot();

  // Collapse children and element if desired. Uses crude heuristics.
  // TODO - this code has side effects, it'd be better if we ran it somewhere else, e.g. traverse values recursively when `ViewerProvider` is initialized.
  useState(() => {
    const tagsDefaultCollapsed = new Set(["Bool", "Number", "Void", "Input"]);
    // TODO - value.size() could be faster.
    const childrenCount = getChildrenValues(value).length;

    const shouldCollapseChildren = childrenCount > 10;

    const shouldCollapseElement = () => {
      if (isRoot) {
        return childrenCount > 30;
      } else {
        return childrenCount > 5 || tagsDefaultCollapsed.has(tag);
      }
    };

    if (shouldCollapseChildren) {
      collapseChildren(value);
    }
    if (shouldCollapseElement()) {
      setCollapsed(path, true);
    }
  });

  const toggleCollapsed = () => {
    toggleCollapsed_(path);
  };

  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    dispatch({
      type: "REGISTER_ITEM_HANDLE",
      payload: { path, handle: { element, forceUpdate } },
    });

    return () => {
      dispatch({
        type: "UNREGISTER_ITEM_HANDLE",
        payload: { path },
      });
    };
  });

  const isOpen = isFocused || !getLocalItemState({ path }).collapsed;
  const _focus = () => !isFocused && !isRoot && focus(path);

  const triangleToggle = () => (
    <div
      className="w-4 mr-1.5 flex justify-center cursor-pointer text-stone-300 hover:text-slate-700"
      onClick={toggleCollapsed}
    >
      <TriangleIcon size={12} className={isOpen ? "rotate-180" : "rotate-90"} />
    </div>
  );

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
    <div className={clsx("font-mono", headerClasses())} onClick={_focus}>
      {name}
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
              <SquiggleValuePreview value={value} isOpen={isOpen} />
            )}
            {!isFocused && !isOpen && <CommentIconForValue value={value} />}
          </div>
          <div className="inline-flex space-x-1 items-center">
            {isOpen && <SquiggleValueHeader value={value} />}
            <SquiggleValueSettingsMenu value={value} />
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
