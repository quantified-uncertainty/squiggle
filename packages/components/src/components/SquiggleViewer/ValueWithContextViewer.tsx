import { clsx } from "clsx";
import { FC, ReactNode, useState } from "react";
import ReactMarkdown from "react-markdown";

import { SqValuePath } from "@quri/squiggle-lang";
import {
  CommentIcon,
  CodeBracketIcon,
  TextTooltip,
  TriangleIcon,
} from "@quri/ui";

import { useEffectRef, useForceUpdate } from "../../lib/hooks/index.js";
import { SqValueWithContext } from "../../lib/utility.js";
import { ErrorBoundary } from "../ErrorBoundary.js";
import {
  useCollapseChildren,
  useFocus,
  useIsFocused,
  useSetCollapsed,
  useToggleCollapsed,
  useViewerContext,
} from "./ViewerProvider.js";
import { getSqValueWidget } from "./getSqValueWidget.js";
import {
  MergedItemSettings,
  getChildrenValues,
  pathToShortName,
} from "./utils.js";

export type SettingsMenuParams = {
  // Used to notify this component that settings have changed, so that it could re-render itself.
  onChange: () => void;
};

type Props = {
  value: SqValueWithContext;
};

export const ValueWithContextViewer: FC<Props> = ({ value }) => {
  const { tag } = value;
  const { path } = value.context;

  const widget = getSqValueWidget(value);
  const heading = widget.heading || value.publicName();
  const hasChildren = () => !!getChildrenValues(value);
  const render: (settings: MergedItemSettings) => ReactNode =
    (value.tag === "Dict" || value.tag === "Array") && hasChildren()
      ? (settings) => (
          <div className="space-y-2 pt-1 mt-1">{widget.render(settings)}</div>
        )
      : widget.render;

  const toggleCollapsed_ = useToggleCollapsed();
  const setCollapsed = useSetCollapsed();
  const collapseChildren = useCollapseChildren();
  const focus = useFocus();
  const { editor, getLocalItemState, getMergedSettings, dispatch } =
    useViewerContext();
  const isFocused = useIsFocused(path);

  const findInEditor = () => {
    const location = value.context.findLocation();
    editor?.scrollTo(location.start.offset);
  };

  // Since `ViewerContext` doesn't store settings, this component won't rerender when `setSettings` is called.
  // So we use `forceUpdate` to force rerendering.
  const forceUpdate = useForceUpdate();

  const isRoot = path.isRoot();

  // Collapse children and element if desired. Uses crude heuristics.
  useState(() => {
    const tagsDefaultCollapsed = new Set(["Bool", "Number", "Void", "Input"]);
    // TODO - value.size() could be faster.
    const childrenCount = getChildrenValues(value).length;

    const shouldCollapseChildren = childrenCount > 10;

    function shouldCollapseElement() {
      if (isRoot) {
        return childrenCount > 30;
      } else {
        return childrenCount > 5 || tagsDefaultCollapsed.has(tag);
      }
    }

    if (shouldCollapseChildren) {
      collapseChildren(value);
    }
    if (shouldCollapseElement()) {
      setCollapsed(path, true);
    }
  });

  const settings = getLocalItemState({ path });

  const getAdjustedMergedSettings = (path: SqValuePath) => {
    const mergedSettings = getMergedSettings({ path });
    const { chartHeight } = mergedSettings;
    return {
      ...mergedSettings,
      chartHeight: isFocused || isRoot ? chartHeight * 4 : chartHeight,
    };
  };

  const toggleCollapsed = () => {
    toggleCollapsed_(path);
    forceUpdate();
  };

  const name = pathToShortName(path);

  // We should switch to ref cleanups after https://github.com/facebook/react/pull/25686 is released.
  const saveRef = useEffectRef((element: HTMLDivElement) => {
    dispatch({
      type: "REGISTER_ITEM_HANDLE",
      payload: { path, element },
    });

    return () => {
      dispatch({
        type: "UNREGISTER_ITEM_HANDLE",
        payload: { path },
      });
    };
  });

  const isOpen = isFocused || !settings.collapsed;
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

  const headerName = (
    <div className={clsx("font-mono", headerClasses())} onClick={_focus}>
      {name}
    </div>
  );
  const headerPreview = () =>
    !!widget.renderPreview && (
      <div
        className={clsx(
          "ml-3 text-sm text-blue-800",
          isOpen ? "opacity-40" : "opacity-60"
        )}
      >
        {widget.renderPreview()}
      </div>
    );
  const headerFindInEditorButton = () => (
    <div className="ml-3">
      <TextTooltip text="Show in Editor" placement="bottom">
        <span>
          <CodeBracketIcon
            className={`items-center h-4 w-4 cursor-pointer text-stone-400 opacity-0 group-hover:opacity-100 hover:!text-stone-800 transition`}
            onClick={() => findInEditor()}
          />
        </span>
      </TextTooltip>
    </div>
  );
  const headerString = () => (
    <div className="text-stone-400 group-hover:text-stone-600 text-sm transition">
      {heading}
    </div>
  );
  const headerSettingsButton = () =>
    widget.renderSettingsMenu?.({ onChange: forceUpdate });

  const leftCollapseBorder = () => (
    <div
      className="group w-4 shrink-0 flex justify-center cursor-pointer"
      onClick={toggleCollapsed}
    >
      <div className="w-px bg-stone-200 group-hover:bg-stone-500" />
    </div>
  );

  const comment = value.context.docstring();
  const hasComment = comment && comment !== "";

  const commentIcon = () =>
    comment && (
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
    );

  const tagsWithTopPosition = new Set([
    "Dict",
    "Array",
    "TableChart",
    "Plot",
    "String",
  ]);
  const commentPosition = tagsWithTopPosition.has(tag) ? "top" : "bottom";

  const isDictOrList = tag === "Dict" || tag === "Array";

  const showComment = () =>
    comment && (
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
    <ErrorBoundary>
      <div ref={saveRef}>
        {(name !== undefined || isRoot) && (
          <header
            className={clsx(
              "flex justify-between group",
              isFocused ? "mb-2" : "hover:bg-stone-100 rounded-md"
            )}
          >
            <div className="inline-flex items-center">
              {!isFocused && triangleToggle()}
              {headerName}
              {!isFocused && headerPreview()}
              {!isFocused && !isOpen && commentIcon()}
              {!isRoot && editor && headerFindInEditorButton()}
            </div>
            <div className="inline-flex space-x-1">
              {isOpen && headerString()}
              {isOpen && headerSettingsButton()}
            </div>
          </header>
        )}
        {isOpen && (
          <div className="flex w-full pt-1">
            {!isFocused && isDictOrList && leftCollapseBorder()}
            {!isFocused && !isDictOrList && !isRoot && (
              <div className="flex w-4 min-w-[1rem]" /> // min-w-1rem = w-4
            )}
            <div className="grow">
              {commentPosition === "top" && hasComment && showComment()}
              {render(getAdjustedMergedSettings(path))}
              {commentPosition === "bottom" && hasComment && showComment()}
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};
