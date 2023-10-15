import { FC, ReactNode, useMemo, useReducer } from "react";
import { clsx } from "clsx";

import {
  ChatBubbleLeftIcon,
  CodeBracketIcon,
  TextTooltip,
  TriangleIcon,
} from "@quri/ui";
import { SqValuePath } from "@quri/squiggle-lang";
import ReactMarkdown from "react-markdown";

import { SqValueWithContext } from "../../lib/utility.js";
import {
  useCollapseChildren,
  useFocus,
  useIsFocused,
  useToggleCollapsed,
  useViewerContext,
} from "./ViewerProvider.js";
import {
  LocalItemState,
  MergedItemSettings,
  getChildrenValues,
  pathToShortName,
} from "./utils.js";
import { useEffectRef } from "../../lib/hooks/useEffectRef.js";

type SettingsMenuParams = {
  // Used to notify VariableBox that settings have changed, so that VariableBox could re-render itself.
  onChange: () => void;
};

export type VariableBoxProps = {
  value: SqValueWithContext;
  heading?: string;
  preview?: ReactNode;
  renderSettingsMenu?: (params: SettingsMenuParams) => ReactNode;
  children: (settings: MergedItemSettings) => ReactNode;
};

export const SqTypeWithCount: FC<{
  type: string;
  count: number;
}> = ({ type, count }) => (
  <div>
    {type}
    <span className="ml-0.5">{count}</span>
  </div>
);

export const VariableBox: FC<VariableBoxProps> = ({
  value,
  heading = "Error",
  preview,
  renderSettingsMenu,
  children,
}) => {
  const toggleCollapsed_ = useToggleCollapsed();
  const collapseChildren = useCollapseChildren();
  const focus = useFocus();
  const { editor, getLocalItemState, getMergedSettings, dispatch } =
    useViewerContext();
  const isFocused = useIsFocused(value.context.path);
  const { tag } = value;

  const findInEditor = () => {
    const location = value.context.findLocation();
    editor?.scrollTo(location.start.offset);
  };

  // Since `ViewerContext` doesn't store settings, `VariableBox` won't rerender when `setSettings` is called.
  // So we use `forceUpdate` to force rerendering.
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  const { path } = value.context;

  const isRoot = Boolean(path.isRoot());

  // This doesn't just memoizes the defaults, but also affects children, in some cases.
  const defaults: LocalItemState = useMemo(() => {
    // TODO - value.size() would be faster.
    const childrenElements = getChildrenValues(value);

    // I'm unsure what good defaults will be here. These are heuristics.
    // Firing this in `useEffect` would be too late in some cases; see https://github.com/quantified-uncertainty/squiggle/pull/1943#issuecomment-1610583706
    if (childrenElements.length > 10) {
      collapseChildren(value);
    }
    return {
      collapsed: !isRoot && childrenElements.length > 5,
      settings: {},
    };
  }, [value, collapseChildren, isRoot]);

  const settings = getLocalItemState({ path, defaults });

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
    !!preview && (
      <div
        className={clsx(
          "ml-3 text-sm text-blue-800",
          isOpen ? "opacity-40" : "opacity-60"
        )}
      >
        {preview}
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
    renderSettingsMenu?.({ onChange: forceUpdate });

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
            <ChatBubbleLeftIcon
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
            {children(getAdjustedMergedSettings(path))}
            {commentPosition === "bottom" && hasComment && showComment()}
          </div>
        </div>
      )}
    </div>
  );
};
