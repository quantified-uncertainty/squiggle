import {
  FC,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import { clsx } from "clsx";

import {
  ChatBubbleLeftIcon,
  CodeBracketIcon,
  TextTooltip,
  TriangleIcon,
} from "@quri/ui";
import { SqValuePath } from "@quri/squiggle-lang";

import { SqValueWithContext } from "../../lib/utility.js";
import {
  useCollapseChildren,
  useFocus,
  useIsFocused,
  useSetSettings,
  useViewerContext,
} from "./ViewerProvider.js";
import {
  LocalItemSettings,
  MergedItemSettings,
  getChildrenValues,
  pathToShortName,
} from "./utils.js";

type SettingsMenuParams = {
  // Used to notify VariableBox that settings have changed, so that VariableBox could re-render itself.
  onChange: () => void;
};

export type VariableBoxProps = {
  value: SqValueWithContext;
  heading?: string;
  preview?: ReactNode;
  isRecordOrList?: boolean;
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
  isRecordOrList = false,
  preview,
  renderSettingsMenu,
  children,
}) => {
  const setSettings = useSetSettings();
  const collapseChildren = useCollapseChildren();
  const focus = useFocus();
  const { editor, getSettings, getMergedSettings, dispatch } =
    useViewerContext();
  const isFocused = useIsFocused(value.context.path);

  const findInEditor = () => {
    const location = value.context.findLocation();
    editor?.scrollTo(location.start.offset);
  };

  // Since `ViewerContext` doesn't store settings, `VariableBox` won't rerender when `setSettings` is called.
  // So we use `forceUpdate` to force rerendering.
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  const { path } = value.context;

  const isRoot = Boolean(path.isRoot());

  // This doesn't just memoizes the detaults, but also affects children, in some cases.
  const defaults: LocalItemSettings = useMemo(() => {
    // TODO - value.size() would be faster.
    const childrenElements = getChildrenValues(value);

    // I'm unsure what good defaults will be here. These are heuristics.
    // Firing this in `useEffect` would be too late in some cases; see https://github.com/quantified-uncertainty/squiggle/pull/1943#issuecomment-1610583706
    if (childrenElements.length > 10) {
      collapseChildren(value);
    }
    return {
      collapsed: !isRoot && childrenElements.length > 5,
    };
  }, [value, collapseChildren, isRoot]);

  const settings = getSettings({ path, defaults });

  const getAdjustedMergedSettings = (path: SqValuePath) => {
    const mergedSettings = getMergedSettings({ path });
    const { chartHeight } = mergedSettings;
    return {
      ...mergedSettings,
      chartHeight: isFocused ? chartHeight * 3 : chartHeight,
    };
  };

  const setSettingsAndUpdate = (newSettings: LocalItemSettings) => {
    setSettings(path, newSettings);
    forceUpdate();
  };

  const toggleCollapsed = () => {
    setSettingsAndUpdate({ ...settings, collapsed: !settings.collapsed });
  };

  const name = pathToShortName(path);

  // should be callback to not fire on each render
  const saveRef = useCallback(
    (element: HTMLDivElement) => {
      dispatch({
        type: "REGISTER_ITEM_HANDLE",
        payload: { path, element },
      });
    },
    [dispatch, path]
  );

  useEffect(() => {
    // This code is a bit risky, because I'm not sure about the order in which ref callbacks and effect cleanups fire.
    // But it works in practice.
    // We should switch to ref cleanups after https://github.com/facebook/react/pull/25686 is released.
    return () => {
      dispatch({
        type: "UNREGISTER_ITEM_HANDLE",
        payload: { path },
      });
    };
  }, [dispatch, path]);

  const hasBodyContent = Boolean(path.items.length);
  const isOpen = isFocused || !settings.collapsed;
  const _focus = () => !isFocused && hasBodyContent && focus(path);

  const triangleToggle = () => (
    <div
      className="cursor-pointer p-1 mr-1 text-stone-300 hover:text-slate-700"
      onClick={toggleCollapsed}
    >
      <TriangleIcon size={10} className={isOpen ? "rotate-180" : "rotate-90"} />
    </div>
  );
  const headerName = (
    <div
      className={clsx(
        "font-mono",
        isFocused
          ? "text-lg text-black ml-1"
          : "text-sm text-stone-800 cursor-pointer hover:underline"
      )}
      onClick={_focus}
    >
      {name}
    </div>
  );
  const headerPreview = () =>
    !!preview && (
      <div
        className={clsx(
          "ml-2 text-sm text-blue-800 font-mono",
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

  const leftCollapseBorder = () =>
    hasBodyContent && (
      <div className="flex group cursor-pointer" onClick={toggleCollapsed}>
        <div className="p-1" />
        <div
          className={clsx(
            "border-l border-stone-200 group-hover:border-stone-500 w-2",
            !isRecordOrList && "border-hidden"
          )}
        />
      </div>
    );

  const comment = value.context.docstring();
  const hasComment = comment && comment !== "";

  const hasCommentIcon = () => (
    <div className="ml-3">
      <TextTooltip text="This variable has a description" placement="bottom">
        <span>
          <ChatBubbleLeftIcon
            size={13}
            className={`text-purple-100 group-hover:text-purple-300`}
          />
        </span>
      </TextTooltip>
    </div>
  );

  const showComment = () => (
    <div
      className={clsx(
        "text-sm text-slate-800 whitespace-pre-line bg-purple-50 bg-opacity-60 py-2 px-3 mb-2 rounded-md",
        !isRecordOrList && "mt-2"
      )}
    >
      {comment}
    </div>
  );

  return (
    <div ref={saveRef}>
      {name === undefined ? null : (
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
            {hasComment && !isFocused && !isOpen && hasCommentIcon()}
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
          {!isFocused && leftCollapseBorder()}
          <div className="grow">
            {isRecordOrList && hasComment && showComment()}
            {children(getAdjustedMergedSettings(path))}
            {!isRecordOrList && hasComment && showComment()}
          </div>
        </div>
      )}
    </div>
  );
};
